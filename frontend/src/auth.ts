import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { JWT } from "next-auth/jwt";
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  secret: process.env.NEXTAUTH_SECRET,
  // Match the backend JWT lifetime (JWT_EXPIRES_IN defaults to 7d in
  // authController.js). Previously this was 5 minutes, which logged
  // users out mid-session even when the backend token was still valid.
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60,  // touch cookie once per day
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
          phone_number: user.phone_number,
          profile_image: user.profile_image,
          is_first_logged_in: user.is_first_logged_in,
          roles: user.roles,
          permissions: user.permissions,
          accessToken: user.accessToken,
        };
      }
      // Historically we returned `null` when `token.exp` had passed,
      // but Auth.js v5 handles maxAge natively via the session config
      // above. Returning null here corrupts the JWT flow and can lock
      // legitimate users out mid-request, so we just pass the token
      // through and let Auth.js expire it on schedule.
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken, // <-- ADD THIS LINE
        user: {
          ...session.user,
          id: token.id as string,
          role: token.role,
          phone_number: token.phone_number,
          profile_image: token.profile_image,
          is_first_logged_in: token.is_first_logged_in,
          roles: token.roles,
          permissions: token.permissions,
        },
      };
    },
  },
});

// Type augmentations
declare module "next-auth" {
  interface User {
    accessToken?: string;
    id: string;
    role?: string | null;
    phone_number?: string | null;
    profile_image?: string | null;
    is_first_logged_in?: boolean;
    roles?: Array<{
      role_id: string;
      name: string;
      permissions?: Array<{
        resource: string;
        action: string;
      }>;
    }>;
    permissions?: string[] | null;
  }

  interface Session {
    accessToken?: string;
    message?: string;
    error?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string | null;
      phone_number?: string | null;
      profile_image?: string | null;
      is_first_logged_in?: boolean;
      roles?: Array<{
        role_id: string;
        name: string;
        permissions?: Array<{
          resource: string;
          action: string;
        }>;
      }>;
      permissions?: string[] | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    accessToken?: string;
    role?: string | null;
    phone_number?: string | null;
    profile_image?: string | null;
    is_first_logged_in?: boolean;
    roles?: Array<{
      role_id: string;
      name: string;
      permissions?: Array<{
        resource: string;
        action: string;
      }>;
    }>;
    permissions?: string[] | null;
  }
}
