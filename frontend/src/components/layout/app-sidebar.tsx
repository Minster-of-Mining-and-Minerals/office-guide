"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  DoorOpen,
  ChevronRight,
  Shield,
  Key,
  BookOpen,
  ExternalLink,
  MonitorPlay,
  Megaphone,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
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
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

/**
 * Navigation model
 * ─────────────────
 * The sidebar is grouped into three labelled sections so admins can find
 * things by intent instead of scanning a flat list:
 *
 *   OVERVIEW       — Dashboard (unlabelled top group)
 *   CONTENT        — What visitors see on the kiosk (floors/offices/announcements)
 *   PUBLIC SCREEN  — How the kiosk behaves + looks (Display), plus a live preview
 *   ADMINISTRATION — Identity management (Users, Roles, Permissions)
 *
 * Section labels collapse to zero-height when the sidebar is icon-only,
 * driven by the shadcn `SidebarGroupLabel` component itself — no extra
 * handling needed here.
 */
type NavItem = {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  /** Open in a new tab (used for the public Office Guide view). */
  external?: boolean;
};

const overviewItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
];

const contentItems: NavItem[] = [
  {
    title: "Floors",
    url: "/floors",
    icon: Building2,
  },
  {
    title: "Offices",
    url: "/offices",
    icon: DoorOpen,
  },
  {
    title: "Announcements",
    url: "/announcements",
    icon: Megaphone,
  },
];

const publicScreenItems: NavItem[] = [
  {
    title: "Display",
    url: "/appearance",
    icon: MonitorPlay,
  },
  {
    title: "Office Guide",
    url: "/office-guide",
    icon: BookOpen,
    external: true,
  },
];

const userManagementItems = [
  {
    title: "Users List",
    url: "/users",
    icon: Users,
  },
  {
    title: "Role Management",
    url: "/users/roles",
    icon: Shield,
  },
  {
    title: "Permission Management",
    url: "/users/permissions",
    icon: Key,
  },
];

// Shared class-name lists — kept as constants so the label sections use
// the same button styling as the legacy flat list, which prevents any
// unintentional visual drift.
const MENU_BUTTON_CLASSES =
  "text-primary hover:bg-golden-metallic px-5 py-5 " +
  "group-data-[collapsible=icon]:px-2 " +
  "group-data-[collapsible=icon]:justify-center " +
  "data-[active=true]:bg-golden-dark " +
  "data-[active=true]:text-primary-foreground";

const SUB_BUTTON_CLASSES =
  "text-primary hover:bg-golden-metallic " +
  "hover:data-[active=false]:bg-golden-metallic " +
  "hover:data-[active=true]:bg-golden-metallic " +
  "hover:data-[active=true]:text-primary-foreground " +
  "group-data-[collapsible=icon]:justify-center " +
  "data-[active=true]:bg-golden-metallic " +
  "data-[active=true]:text-primary";

const COLLAPSIBLE_TRIGGER_CLASSES =
  "text-primary hover:bg-golden-metallic " +
  "hover:data-[active=false]:bg-golden-metallic " +
  "hover:data-[active=true]:bg-golden-dark " +
  "hover:data-[active=true]:text-primary-foreground " +
  "px-5 py-5 group-data-[collapsible=icon]:px-2 " +
  "group-data-[collapsible=icon]:justify-center " +
  "data-[active=true]:bg-golden-dark " +
  "data-[active=true]:text-primary-foreground";

function NavGroup({
  label,
  items,
}: {
  label?: string;
  items: NavItem[];
}) {
  const pathname = usePathname();
  return (
    <SidebarGroup className="px-5 group-data-[collapsible=icon]:px-0">
      {label && (
        <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.14em] text-golden-dark/60 px-2">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu className="gap-2 group-data-[collapsible=icon]:items-center">
          {items.map((item) => (
            <SidebarMenuItem
              key={item.title}
              className="group-data-[collapsible=icon]:w-fit"
            >
              <SidebarMenuButton
                asChild
                isActive={!item.external && pathname === item.url}
                tooltip={item.title}
                className={MENU_BUTTON_CLASSES}
              >
                <Link
                  href={item.url}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                  className="flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:items-center"
                >
                  <item.icon className="group-data-[collapsible=icon]:size-5" />
                  <span className="text-base group-data-[collapsible=icon]:hidden">
                    {item.title}
                  </span>
                  {item.external && (
                    <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-60 group-data-[collapsible=icon]:hidden" />
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="floating">
      {/* ---------- HEADER ---------- */}
      <SidebarHeader className="py-10">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/dashboard" className="flex flex-col items-center">
              <Image
                src="/logo-only.png"
                alt="Ministry of Mining Logo"
                width={100}
                height={100}
                priority
                className="mx-auto mb-1 rounded-xl p-2 h-auto w-auto"
              />
              <div className="grid flex-1 text-center gap-1 text-sm leading-tight group-data-[collapsible=icon]:opacity-0">
                <span className="truncate font-semibold text-golden-dark">
                  Ministry of Mining
                </span>
                <span className="truncate text-golden-dark">
                  Digital Signage System
                </span>
              </div>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ---------- CONTENT ---------- */}
      <SidebarContent>
        {/* Top-level dashboard — no section label so it reads as the entry
            point rather than a category. */}
        <NavGroup items={overviewItems} />

        <NavGroup label="Content" items={contentItems} />

        <NavGroup label="Public Screen" items={publicScreenItems} />

        {/* Users has a nested menu so it stays as a collapsible group in
            its own dedicated section labelled Administration. */}
        <SidebarGroup className="px-5 group-data-[collapsible=icon]:px-0">
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.14em] text-golden-dark/60 px-2">
            Administration
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 group-data-[collapsible=icon]:items-center">
              <Collapsible
                asChild
                defaultOpen={pathname.startsWith("/users")}
                className="group/collapsible"
              >
                <SidebarMenuItem className="group-data-[collapsible=icon]:w-fit">
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Users"
                      isActive={pathname.startsWith("/users")}
                      className={COLLAPSIBLE_TRIGGER_CLASSES}
                    >
                      <Users className="group-data-[collapsible=icon]:size-5" />
                      <span className="text-base group-data-[collapsible=icon]:hidden">
                        Users
                      </span>
                      <ChevronRight
                        className="ml-auto transition-transform duration-200
                          group-data-[state=open]/collapsible:rotate-90
                          group-data-[collapsible=icon]:hidden"
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="pt-1">
                      {userManagementItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === subItem.url}
                            className={SUB_BUTTON_CLASSES}
                          >
                            <Link href={subItem.url}>
                              <subItem.icon className="h-4 w-4" />
                              <span>{subItem.title}</span>
                            </Link>
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
    </Sidebar>
  );
}
