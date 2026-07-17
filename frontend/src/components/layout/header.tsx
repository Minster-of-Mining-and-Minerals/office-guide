"use client";

import { Bell } from "lucide-react";
import { useSession } from "next-auth/react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { NavUser } from "./nav-user";

interface HeaderProps {
  title?: string;
}

/**
 * Sticky top bar for the admin. Pulls user identity from `useSession()`
 * so the profile dropdown shows the actually-signed-in admin — the
 * previous version hardcoded "John Doe" which made the logout button
 * confusing (users didn't trust it was tied to their real account).
 */
export function Header({ title }: HeaderProps) {
  const { data: session } = useSession();
  const notificationCount = 3; // TODO: hook this up when notifications land

  const userData = {
    name: session?.user?.name ?? "Signed-in user",
    email: session?.user?.email ?? "",
    avatar: session?.user?.profile_image ?? undefined,
  };

  return (
    <header className="flex z-30 sticky shadow-md top-2 border h-16 shrink-0 items-center gap-2 px-4 rounded-xl bg-sidebar text-sidebar-foreground m-2 mb-0">
      <SidebarTrigger className="-ml-1" />
      {title && <h1 className="text-lg font-semibold">{title}</h1>}
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {notificationCount > 0 && (
            <span className="absolute text-white font-bold -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
        <NavUser user={userData} />
      </div>
    </header>
  );
}
