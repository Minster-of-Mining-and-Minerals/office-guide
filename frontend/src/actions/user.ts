"use server";

import { signIn, signOut, auth } from "@/auth";
import { AuthError } from "next-auth";

export const login = async (email: string, password: string) => {
  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if ((res as any)?.error) {
      return { error: "Invalid email or password." };
    }

    return { success: true };
  } catch (error: any) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin" || (error as any).code === "credentials") {
        return { error: "Invalid email or password." };
      }
      if ((error as any).code === "inactive_user") {
        return { error: "Your account is inactive. Please contact an administrator." };
      }
      return { error: error.message || "Invalid credentials or authentication error." };
    }

    if (error?.type === "CredentialsSignin" || error?.code === "credentials" || error?.cause?.err?.code === "credentials") {
      return { error: "Invalid email or password." };
    }

    if (error?.code === "inactive_user" || error?.cause?.err?.code === "inactive_user") {
      return { error: "Your account is inactive. Please contact an administrator." };
    }

    return {
      error:
        typeof error === "string"
          ? error
          : error?.message || "Something went wrong during login. Please try again.",
    };
  }
};

export const logout = async () => {
  await signOut({ redirectTo: "/login" });
};

export const getSession = async () => {
  return await auth();
};

export const getCurrentUser = async () => {
  const session = await auth();
  return session?.user ?? null;
};

export const checkPermission = async (permissionKey: string) => {
  const session = await auth();
  if (!session?.user?.permissions) return false;
  return session.user.permissions.includes(permissionKey);
};

export const hasRole = async (roleName: string) => {
  const session = await auth();
  if (!session?.user?.roles) return false;
  return session.user.roles.some((role) => role.name === roleName);
};