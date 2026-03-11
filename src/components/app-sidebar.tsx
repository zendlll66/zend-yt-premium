"use client";

import * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CommandIcon,
  DashboardSquare01Icon,
  ReceiptTextIcon,
  Package01Icon,
  Folder01Icon,
  UserMultipleIcon,
  Settings05Icon,
  SecurityIcon,
} from "@hugeicons/core-free-icons";
import { canAccess, type PermissionRule } from "@/config/permissions";

const NAV_MAIN = [
  {
    title: "dashboard",
    url: "/dashboard",
    icon: <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />,
    isActive: true,
  },
  {
    title: "รายการคำสั่งเช่า",
    url: "/dashboard/orders",
    icon: <HugeiconsIcon icon={ReceiptTextIcon} strokeWidth={2} />,
    isActive: true,
  },
  {
    title: "จัดการสินค้า",
    url: "#",
    icon: <HugeiconsIcon icon={Package01Icon} strokeWidth={2} />,
    isActive: true,
    items: [
      { title: "รายการสินค้า", url: "/dashboard/products" },
      { title: "เพิ่มสินค้า", url: "/dashboard/products/add" },
      { title: "ตัวเลือก (Modifiers)", url: "/dashboard/modifiers" },
    ],
  },
  {
    title: "หมวดหมู่สินค้า",
    url: "#",
    icon: <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} />,
    isActive: true,
    items: [
      { title: "รายการหมวดหมู่", url: "/dashboard/categories" },
      { title: "เพิ่มหมวดหมู่", url: "/dashboard/categories/add" },
    ],
  },
  {
    title: "user management",
    url: "#",
    icon: <HugeiconsIcon icon={UserMultipleIcon} strokeWidth={2} />,
    isActive: true,
    items: [
      { title: "user list", url: "/dashboard/user-list" },
      { title: "add user", url: "/dashboard/user-list/add" },
    ],
  },
  {
    title: "แผนสมาชิก",
    url: "#",
    icon: <HugeiconsIcon icon={UserMultipleIcon} strokeWidth={2} />,
    isActive: true,
    items: [
      { title: "แผนรายเดือน/รายปี", url: "/dashboard/membership-plans" },
      { title: "รายการสมัครสมาชิก", url: "/dashboard/memberships" },
    ],
  },
  {
    title: "ตั้งค่าร้าน",
    url: "/dashboard/settings",
    icon: <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} />,
    isActive: true,
  },
  {
    title: "สิทธิ์การเข้าถึง",
    url: "/dashboard/permissions",
    icon: <HugeiconsIcon icon={SecurityIcon} strokeWidth={2} />,
    items: [
      { title: "กำหนดสิทธิ์หน้า", url: "/dashboard/permissions" },
    ],
  },
];

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: { name: string; email: string; role?: string };
  permissions?: PermissionRule[] | null;
};

function filterNavByPermission(
  nav: typeof NAV_MAIN,
  role: string,
  permissions: PermissionRule[] | null | undefined
) {
  const roleSafe = role || "";
  return nav
    .map((group) => {
      const items = group.items?.filter((item) =>
        canAccess(item.url, roleSafe, permissions)
      ) ?? [];
      if (group.url && group.url !== "#" && !canAccess(group.url, roleSafe, permissions)) {
        return null;
      }
      if (items.length === 0 && (!group.url || group.url === "#")) return null;
      return { ...group, items };
    })
    .filter((g): g is NonNullable<typeof g> => g != null);
}

export function AppSidebar({ user, permissions, ...props }: AppSidebarProps) {
  const navMain = filterNavByPermission(NAV_MAIN, user.role ?? "", permissions);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <HugeiconsIcon icon={CommandIcon} strokeWidth={2} className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Zend Rental</span>
                  <span className="truncate text-xs">Dashboard</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
