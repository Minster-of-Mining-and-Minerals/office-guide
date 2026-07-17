"use client";

import { signOut } from "next-auth/react";

/**
 * Single, canonical logout routine used everywhere in the app:
 *
 *   - The nav-user dropdown "Log out" button
 *   - The RTK Query 401 auto-logout in `baseApi.ts`
 *   - The private layout guard when the session goes missing
 *
 * Copies the CMS approach: wipe every local storage bucket + every
 * cookie the browser holds, then let NextAuth's client-side `signOut`
 * clear the session cookie and do a normal browser navigation to
 * `callbackUrl`. Using the client `signOut` (not the server action)
 * avoids the NEXT_REDIRECT throw pattern that a try/catch would
 * mistakenly treat as a failure.
 */
export async function performLogout(callbackUrl: string = "/login"): Promise<void> {
  if (typeof window !== "undefined") {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // Storage may be blocked in some browsers (private mode); ignore.
    }

    // Nuke every non-httpOnly cookie by expiring it at the current path
    // AND the current hostname. httpOnly cookies (NextAuth's session
    // token is one) will be cleared by `signOut` below.
    try {
      const host = window.location.hostname;
      for (const raw of document.cookie.split(";")) {
        const eq = raw.indexOf("=");
        const name = (eq > -1 ? raw.slice(0, eq) : raw).trim();
        if (!name) continue;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${host}`;
      }
    } catch {
      // Same story — cookie access can be blocked; safe to ignore.
    }
  }

  try {
    await signOut({ callbackUrl, redirect: true });
  } catch (err) {
    // NextAuth's client `signOut` normally handles navigation itself.
    // If it throws (e.g. offline, CSRF hiccup, browser extension
    // interference), we still owe the user a clean landing page.
    // eslint-disable-next-line no-console
    console.warn("[performLogout] signOut threw — falling back to hard nav:", err);
  }

  // Belt-and-suspenders hard navigation. If `signOut` already navigated
  // we never reach this line; if it didn't (rare — some Auth.js edge
  // cases where the fetch resolves without redirecting), this forces
  // the user off the private page and through the middleware, which
  // sees no cookie and lands them on `/login` fresh.
  if (typeof window !== "undefined") {
    window.location.href = callbackUrl;
  }
}
