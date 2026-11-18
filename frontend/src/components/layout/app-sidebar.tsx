"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  DoorOpen,
  ChevronDown,
  BookOpen,
  ExternalLink,
  MonitorPlay,
  Megaphone,
  Palette,
  Sun,
  Moon,
  Monitor,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  useAdminTheme,
  type AdminThemePreference,
} from "@/components/common/AdminThemeProvider";
import { cn } from "@/lib/utils";

/**
 * Navigation model
 * ─────────────────
 *   OVERVIEW       — Dashboard
 *   CONTENT        — What visitors see on the kiosk (floors/offices/announcements)
 *   PUBLIC SCREEN  — What kiosks show (Display), their colours (Theme), the live guide
 *   ADMINISTRATION — Identity management (Users, Roles, Permissions)
 *
 * Colours come from the admin day/night palette (admin-sb-* tokens), so the
 * sidebar is petrol blue in day mode and deep navy at night.
 */
type NavItem = {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  /** Open in a new tab (used for the public Office Guide view). */
  external?: boolean;
};

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Content",
    items: [
      { title: "Floors", url: "/floors", icon: Building2 },
      { title: "Offices", url: "/offices", icon: DoorOpen },
      { title: "Announcements", url: "/announcements", icon: Megaphone },
    ],
  },
  {
    label: "Public screen",
    items: [
      { title: "Display", url: "/appearance", icon: MonitorPlay },
      { title: "Theme", url: "/theme", icon: Palette },
      { title: "Office Guide", url: "/", icon: BookOpen, external: true },
    ],
  },
];

const USER_ITEMS = [
  { title: "Users list", url: "/users" },
  { title: "Roles", url: "/users/roles" },
  { title: "Permissions", url: "/users/permissions" },
];

// Active item: soft gold fill, gold text, and a short bar at the left edge.
const ITEM_CLASSES =
  "relative h-9 rounded-lg px-3 text-[13.5px] font-medium text-admin-sb-text/90 transition-colors " +
  "hover:bg-admin-sb-text/10 hover:text-admin-sb-text " +
  "data-[active=true]:bg-admin-sb-active/12 data-[active=true]:font-semibold data-[active=true]:text-admin-sb-active " +
  "data-[active=true]:before:absolute data-[active=true]:before:left-0 data-[active=true]:before:top-2 " +
  "data-[active=true]:before:bottom-2 data-[active=true]:before:w-[3px] data-[active=true]:before:rounded-r " +
  "data-[active=true]:before:bg-admin-sb-bar " +
  "group-data-[collapsible=icon]:justify-center";

const GROUP_LABEL_CLASSES =
  "h-6 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-admin-sb-muted";

const MODE_OPTIONS: {
  value: AdminThemePreference;
  label: string;
  icon: typeof Sun;
}[] = [
  { value: "day", label: "Day", icon: Sun },
  { value: "night", label: "Night", icon: Moon },
  { value: "auto", label: "Auto", icon: Monitor },
];

function ModeSwitch() {
  const { preference, setPreference } = useAdminTheme();
  const { state, isMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;

  if (collapsed) {
    // One button that cycles Day → Night → Auto.
    const i = MODE_OPTIONS.findIndex((o) => o.value === preference);
    const current = MODE_OPTIONS[i] ?? MODE_OPTIONS[2];
    const next = MODE_OPTIONS[(i + 1) % MODE_OPTIONS.length];
    const Icon = current.icon;
    return (
      <SidebarMenuButton
        tooltip={`Colour: ${current.label}. Click for ${next.label}.`}
        onClick={() => setPreference(next.value)}
        className="h-9 justify-center bg-admin-sb-active/15 text-admin-sb-active hover:bg-admin-sb-active/25 hover:text-admin-sb-active"
      >
        <Icon className="size-4" />
        <span className="sr-only">Colour mode: {current.label}</span>
      </SidebarMenuButton>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Colour mode"
      className="grid grid-cols-3 gap-0.5 rounded-lg bg-admin-sb-text/10 p-0.5"
    >
      {MODE_OPTIONS.map((o) => {
        const on = preference === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => setPreference(o.value)}
            title={o.value === "auto" ? "Follow this computer’s setting" : `${o.label} mode`}
            className={cn(
              "inline-flex items-center justify-center gap-1 rounded-md py-1.5 text-[11.5px] font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-sb-active",
              on
                ? "bg-admin-sb-active/20 text-admin-sb-active"
                : "text-admin-sb-muted hover:text-admin-sb-text"
            )}
          >
            <o.icon className="size-3.5" />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function CollapseButton() {
  const { state, toggleSidebar, isMobile } = useSidebar();
  if (isMobile) return null;
  const collapsed = state === "collapsed";
  return (
    <SidebarMenuButton
      onClick={toggleSidebar}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      tooltip={collapsed ? "Expand sidebar" : undefined}
      className="h-8 px-3 text-[12.5px] text-admin-sb-muted hover:bg-admin-sb-text/10 hover:text-admin-sb-text group-data-[collapsible=icon]:justify-center"
    >
      {collapsed ? (
        <PanelLeftOpen className="size-4" />
      ) : (
        <PanelLeftClose className="size-4" />
      )}
      <span className="group-data-[collapsible=icon]:hidden">Collapse sidebar</span>
    </SidebarMenuButton>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const usersActive = pathname.startsWith("/users");

  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="[&_[data-sidebar=sidebar]]:bg-admin-sidebar [&_[data-sidebar=sidebar]]:border-admin-sb-border [&_[data-sidebar=sidebar]]:text-admin-sb-text"
    >
      {/* ---------- BRAND ---------- */}
      <SidebarHeader className="border-b border-admin-sb-text/10 px-3 py-4 group-data-[collapsible=icon]:px-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-lg group-data-[collapsible=icon]:justify-center"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-admin-sb-brand/15 ring-1 ring-admin-sb-brand/30 group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:w-9">
            <Image
              src="/logo-only.png"
              alt="Ministry of Mining logo"
              width={34}
              height={34}
              priority
              className="h-auto w-auto rounded-md"
            />
          </span>
          <span className="grid min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-[14px] font-bold text-admin-sb-brand">
              Ministry of Mining
            </span>
            <span className="truncate text-[11.5px] text-admin-sb-muted">
              የማዕድን ሚኒስቴር
            </span>
          </span>
        </Link>
      </SidebarHeader>

      {/* ---------- NAVIGATION ---------- */}
      <SidebarContent className="gap-0 py-2">
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label} className="px-2 py-1">
            <SidebarGroupLabel className={GROUP_LABEL_CLASSES}>
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={!item.external && pathname === item.url}
                      tooltip={item.external ? `${item.title} (opens in a new tab)` : item.title}
                      className={ITEM_CLASSES}
                    >
                      <Link
                        href={item.url}
                        target={item.external ? "_blank" : undefined}
                        rel={item.external ? "noopener noreferrer" : undefined}
                      >
                        <item.icon className="size-4 opacity-80" />
                        <span className="group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                        {item.external && (
                          <ExternalLink
                            aria-label="opens in a new tab"
                            className="ml-auto size-3.5 opacity-60 group-data-[collapsible=icon]:hidden"
                          />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarGroup className="px-2 py-1">
          <SidebarGroupLabel className={GROUP_LABEL_CLASSES}>
            Administration
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <Collapsible
                asChild
                defaultOpen={usersActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Users"
                      className={cn(
                        ITEM_CLASSES,
                        usersActive && "text-admin-sb-active hover:text-admin-sb-active"
                      )}
                    >
                      <Users className="size-4 opacity-80" />
                      <span className="group-data-[collapsible=icon]:hidden">Users</span>
                      <ChevronDown className="ml-auto size-3.5 opacity-60 transition-transform duration-200 -rotate-90 group-data-[state=open]/collapsible:rotate-0 group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="ml-[18px] mr-0 border-l border-admin-sb-text/15 py-0.5 pl-2.5 pr-0">
                      {USER_ITEMS.map((sub) => (
                        <SidebarMenuSubItem key={sub.url}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === sub.url}
                            className={cn(
                              ITEM_CLASSES,
                              "h-8 text-[13px] data-[active=true]:before:top-1.5 data-[active=true]:before:bottom-1.5"
                            )}
                          >
                            <Link href={sub.url}>{sub.title}</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ---------- FOOTER: colour mode + collapse ---------- */}
      <SidebarFooter className="gap-1.5 border-t border-admin-sb-text/10 p-2">
        <ModeSwitch />
        <CollapseButton />
      </SidebarFooter>
    </Sidebar>
  );
}
