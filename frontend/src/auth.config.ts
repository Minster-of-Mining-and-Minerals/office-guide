import CredentialsProvider from "next-auth/providers/credentials";
import { CredentialsSignin, type NextAuthConfig } from "next-auth";

/**
 * Typed `CredentialsSignin` subclasses so the login page can distinguish
 * "inactive user" from "wrong password" errors without parsing message
 * strings. Modeled after PMS's approach — every `code` here becomes
 * `error.code` at the call site.
 */
class InactiveUserError extends CredentialsSignin {
  code = "inactive_user";
}
class LoginValidationError extends CredentialsSignin {
  code = "validation_error";
}

export default {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const email = String(credentials.email ?? "").trim().toLowerCase();
        const password = String(credentials.password ?? "").trim();

        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/auth/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
            }
          );

          const data = await res.json().catch(() => ({}));

          if (res.status === 400) {
            throw new LoginValidationError();
          }
          if (res.status === 403 && data?.message === "User is inactive") {
            throw new InactiveUserError();
          }
          if (!res.ok || !data?.success) {
            return null;
          }

          const user = data.data?.user;
          const rawRoles: Array<{
            role_id: string;
            name: string;
            permissions?: Array<{ resource: string; action: string }>;
          }> = data.data?.roles ?? [];
          const token: string | undefined = data.token || data.data?.token;

          if (!user || !token) return null;

          // Flatten permission tuples into "resource:action" keys.
          // This is the shape the private UI expects everywhere. The
          // previous implementation read `data.roles?.flatMap(...)`
          // (wrong path — should be `data.data.roles`) AND accessed
          // `p.name` (wrong key — backend returns `resource`/`action`).
          const permissions = Array.from(
            new Set(
              rawRoles.flatMap((r) =>
                (r.permissions ?? []).map(
                  (p) => `${p.resource}:${p.action}`
                )
              )
            )
          );

          // Transform roles to match the next-auth User type augmentation
          // (expects permission objects with permission_id, name, key).
          const roles = rawRoles.map((r) => ({
            role_id: r.role_id,
            name: r.name,
            permissions: (r.permissions ?? []).map((p) => ({
              permission_id: `${p.resource}:${p.action}`,
              name: p.action,
              key: p.resource,
            })),
          }));

          return {
            accessToken: token,
            id: user.user_id,
            email: user.email,
            name: user.full_name,
            phone_number: user.phone_number,
            profile_image: user.profile_image,
            is_first_logged_in: user.is_first_logged_in,
            role: roles[0]?.name ?? null,
            roles,
            permissions,
          };
        } catch (err) {
          if (
            err instanceof InactiveUserError ||
            err instanceof LoginValidationError
          ) {
            throw err;
          }
          console.error("[auth.authorize] failed:", err);
          return null;
        }
      },
    }),
  ],
} satisfies NextAuthConfig;
