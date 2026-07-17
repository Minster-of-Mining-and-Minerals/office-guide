"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2Icon } from "lucide-react";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { performLogout } from "@/utils/logout";

/**
 * Browsers may restore this page from the back-forward cache (bfcache)
 * on Back/Forward navigation. When `event.persisted === true`, React
 * state (including a stale `useSession()` result) is restored as-is
 * without re-running effects. Forcing a hard reload puts the request
 * through the middleware again, which will bounce unauthenticated
 * users to `/login` before any private content paints.
 */
function useBfcacheGuard() {
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);
}

/**
 * Private layout — every route under `(private)/` renders inside this.
 * Three responsibilities:
 *
 *   1. While NextAuth is still hydrating the session on the client,
 *      show a spinner instead of leaking the sidebar/header.
 *   2. If the session is confirmed missing (rare — middleware should
 *      have redirected earlier, but this catches token expiry that
 *      happens after the page loaded), force a clean logout.
 *   3. If the user still has `is_first_logged_in: true`, forward them
 *      to `/change-password` (skeleton — the page itself is Phase 3).
 */
export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  useBfcacheGuard();

  const isFirstLogin = session?.user?.is_first_logged_in === true;
  const isChangePasswordPage = pathname === "/change-password";

  useEffect(() => {
    if (status === "unauthenticated") {
      // Middleware normally catches this, but if the session dies
      // while a page is open we still want a clean bounce.
      void performLogout("/login");
    }
  }, [status]);

  useEffect(() => {
    if (
      status === "authenticated" &&
      isFirstLogin &&
      !isChangePasswordPage
    ) {
      router.replace("/change-password");
    }
  }, [status, isFirstLogin, isChangePasswordPage, router]);

  // Convert "/users" → ["Users"]
  const breadcrumb = pathname
    .split("/")
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1));
  const title = breadcrumb.join(" / ");

  // Full-page spinner while the session is being resolved OR being
  // torn down. Never render private content in either state.
  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen w-full grid place-items-center bg-background">
        <Loader2Icon className="h-6 w-6 animate-spin text-golden-dark" />
      </div>
    );
  }

  // Waiting for the change-password redirect to fire.
  if (isFirstLogin && !isChangePasswordPage) {
    return (
      <div className="min-h-screen w-full grid place-items-center bg-background">
        <Loader2Icon className="h-6 w-6 animate-spin text-golden-dark" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      {!isFirstLogin && <AppSidebar />}
      <SidebarInset>
        <Header title={title || "Dashboard"} />
        <div className="p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
