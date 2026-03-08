/**
 * กำหนดว่า path ไหน role ไหนเข้าได้
 * เรียงจาก path เฉพาะมากไปน้อย (path ยาวมาก่อน) เพื่อให้ match ถูก path
 */
export type Role = "super_admin" | "admin" | "cashier" | "chef";

export type PagePermission = {
  path: string;
  label: string;
  roles: Role[];
};

/** รายการ path กับ role ที่เข้าได้ (path ที่ยาวกว่าก่อน) */
export const PAGE_PERMISSIONS: PagePermission[] = [
  { path: "/dashboard/user-list/add", label: "เพิ่มผู้ใช้", roles: ["super_admin", "admin"] },
  { path: "/dashboard/user-list", label: "รายการผู้ใช้", roles: ["super_admin", "admin"] },
  { path: "/dashboard/permissions", label: "สิทธิ์การเข้าถึงหน้า", roles: ["super_admin", "admin"] },
  { path: "/dashboard", label: "แดชบอร์ด", roles: ["super_admin", "admin", "cashier", "chef"] },
];

/** เช็คว่า role นี้เข้า path นี้ได้ไหม */
export function canAccess(pathname: string, role: string): boolean {
  const normalized = pathname.replace(/\/$/, "") || "/";
  const sorted = [...PAGE_PERMISSIONS].sort((a, b) => b.path.length - a.path.length);
  const rule = sorted.find((r) => {
    const p = r.path.replace(/\/$/, "") || "/";
    return normalized === p || normalized.startsWith(p + "/");
  });
  if (!rule) return true;
  return rule.roles.includes(role as Role);
}

/** label ของ role (สำหรับแสดงในหน้า permissions) */
export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "แอดมิน",
  cashier: "แคชเชียร์",
  chef: "เชฟ",
};
