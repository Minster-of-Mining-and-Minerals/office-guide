"use client";

import { Bell } from "lucide-react";
import { useSession } from "next-auth/react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { NavUser } from "./nav-user";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { data: session } = useSession();
  const notificationCount = 3;

  const userData = {
    name: session?.user?.name ?? "Signed-in user",
    email: session?.user?.email ?? "",
    avatar: session?.user?.profile_image ?? undefined,
  };

  return (
    <header className="flex z-30 sticky top-2 h-16 shrink-0 items-center gap-3 px-4 mx-2 mb-0 rounded-xl bg-admin-surface border border-admin-border shadow-lg shadow-black/30">
      {/* subtle shimmer */}
      <div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 10% 0%, hsl(45,100%,50%,0.15) 0, transparent 60%)",
        }}
      />

      <SidebarTrigger className="-ml-1 relative text-admin-muted hover:text-admin-accent-text hover:bg-admin-chip" />

      {title && (
        <div className="relative flex items-center gap-2">
          <span className="h-4 w-px bg-admin-chip hidden sm:block" />
          <h1 className="text-sm font-semibold text-admin-text tracking-wide uppercase">
            {title}
          </h1>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2 relative">
        <Button
          variant="ghost"
          size="icon"
          className="relative text-admin-muted hover:text-admin-accent-text hover:bg-admin-chip"
        >
          <Bell className="size-5" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-golden-dark text-[10px] font-bold text-white border border-admin-active/40">
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
