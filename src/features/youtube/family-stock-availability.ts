import { sql } from "drizzle-orm";
import { familyMembers } from "@/db/schema/family.schema";
import { orders } from "@/db/schema/order.schema";

/** ช่อง family_members ว่างสำหรับมอบให้ออเดอร์ใหม่ */
export const familyMemberSlotOpenSql = sql`(${familyMembers.orderId} is null or ${orders.status} in ('cancelled', 'refunded'))`;

/**
 * มี "ลิงก์เชิญ" สำหรับสินค้าประเภท invite:
 * - คอลัมน์ invite_link
 * - หรือเก็บ URL ใน email / member_password (กรณีกรอกมือหรือข้อมูลเก่า)
 */
export const familyMemberHasInviteUrlSql = sql`(
  length(trim(coalesce(${familyMembers.inviteLink}, ''))) > 0
  or ${familyMembers.email} like 'http%'
  or trim(coalesce(${familyMembers.memberPassword}, '')) like 'http%'
)`;

/** ช่องแบบอีเมล+รหัส (สินค้า family) — ไม่ใช่ช่องลิงก์เชิญ */
export const familyMemberCredentialOnlySql = sql`(
  length(trim(coalesce(${familyMembers.inviteLink}, ''))) = 0
  and ${familyMembers.email} not like 'http%'
  and trim(coalesce(${familyMembers.memberPassword}, '')) not like 'http%'
)`;

export function resolveFamilyInviteUrl(row: {
  inviteLink: string | null | undefined;
  email: string;
  memberPassword: string | null | undefined;
}): string | null {
  const fromCol = row.inviteLink?.trim();
  if (fromCol) return fromCol;
  const e = row.email?.trim() ?? "";
  if (e.startsWith("http")) return e;
  const p = row.memberPassword?.trim() ?? "";
  if (p.startsWith("http")) return p;
  return null;
}
