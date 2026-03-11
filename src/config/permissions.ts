/**
 * กำหนดว่า path ไหน role ไหนเข้าได้
 * เรียงจาก path เฉพาะมากไปน้อย (path ยาวมาก่อน)
 */
export type Role = "super_admin" | "admin" | "cashier" | "chef";

export type PagePermission = {
  path: string;
  label: string;
  roles: Role[];
};

export const PAGE_PERMISSIONS: PagePermission[] = [
  { path: "/dashboard/orders", label: "รายการคำสั่งเช่า", roles: ["super_admin", "admin", "cashier", "chef"] },
  { path: "/dashboard/modifiers/add", label: "เพิ่มกลุ่มตัวเลือก", roles: ["super_admin", "admin"] },
  { path: "/dashboard/modifiers", label: "ตัวเลือกสินค้า", roles: ["super_admin", "admin"] },
  { path: "/dashboard/categories/add", label: "เพิ่มหมวดหมู่", roles: ["super_admin", "admin"] },
  { path: "/dashboard/categories", label: "หมวดหมู่สินค้า", roles: ["super_admin", "admin"] },
  { path: "/dashboard/products/add", label: "เพิ่มสินค้า", roles: ["super_admin", "admin"] },
  { path: "/dashboard/products", label: "จัดการสินค้า", roles: ["super_admin", "admin"] },
  { path: "/dashboard/user-list/add", label: "เพิ่มผู้ใช้", roles: ["super_admin", "admin"] },
  { path: "/dashboard/user-list", label: "รายการผู้ใช้", roles: ["super_admin", "admin"] },
  { path: "/dashboard/membership-plans", label: "แผนสมาชิก", roles: ["super_admin", "admin"] },
  { path: "/dashboard/memberships", label: "รายการสมัครสมาชิก", roles: ["super_admin", "admin"] },
  { path: "/dashboard/permissions", label: "สิทธิ์การเข้าถึงหน้า", roles: ["super_admin"] },
  { path: "/dashboard/settings", label: "ตั้งค่าร้าน", roles: ["super_admin", "admin"] },
  { path: "/dashboard/multi-display", label: "จอแสดงผล (Multi-display)", roles: ["super_admin", "admin", "cashier", "chef"] },
  { path: "/dashboard", label: "แดชบอร์ด", roles: ["super_admin", "admin", "cashier", "chef"] },
];

export type PermissionRule = { path: string; roles: string[] };

export function canAccess(
  pathname: string,
  role: string,
  rulesFromDb?: PermissionRule[] | null
): boolean {
  const normalized = pathname.replace(/\/$/, "") || "/";
  const rules =
    rulesFromDb && rulesFromDb.length > 0
      ? rulesFromDb
      : PAGE_PERMISSIONS.map((r) => ({ path: r.path, roles: r.roles }));
  const sorted = [...rules].sort((a, b) => b.path.length - a.path.length);
  const rule = sorted.find((r) => {
    const p = (r.path || "").replace(/\/$/, "") || "/";
    return normalized === p || normalized.startsWith(p + "/");
  });
  if (!rule) return true;
  return rule.roles.includes(role);
}

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "แอดมิน",
  cashier: "แคชเชียร์",
  chef: "เชฟ",
};
