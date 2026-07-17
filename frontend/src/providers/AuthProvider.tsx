"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Thin client-boundary wrapper for NextAuth's SessionProvider. Mounted
 * once at the root of the app tree so any client component can call
 * `useSession()` without exploding.
 *
 * `refetchOnWindowFocus: false` — we already refresh on demand via the
 * login page's `update()` call and don't need chatty polling; the
 * cookie is the source of truth.
 */
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  );
}
