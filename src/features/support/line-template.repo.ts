import { db } from "@/db";
import { lineMessageTemplates } from "@/db/schema/line-message-template.schema";
import { eq, inArray } from "drizzle-orm";

export type LineTemplateRow = typeof lineMessageTemplates.$inferSelect;

const DEFAULT_TEMPLATES: { key: string; name: string; template: string; isEnabled: boolean }[] = [
  // ── Order ─────────────────────────────────────────────────────
  {
    key: "order_confirm",
    name: "รับ Order ใหม่",
    template:
      "✅ ได้รับคำสั่งซื้อ #{{orderNumber}} แล้ว\nยอด: {{totalPrice}} บาท\nกรุณาชำระเงินเพื่อดำเนินการต่อ",
    isEnabled: true,
  },
  {
    key: "order_paid",
    name: "ชำระเงินสำเร็จ",
    template:
      "💳 ชำระเงินสำเร็จ Order #{{orderNumber}}\nยอด: {{totalPrice}} บาท\nเราจะส่ง credentials ให้เร็วๆ นี้",
    isEnabled: true,
  },
  {
    key: "order_fulfilled",
    name: "ส่งมอบ credentials แล้ว",
    template:
      "🎉 Order #{{orderNumber}} ส่งมอบแล้ว!\nดู credentials ได้ที่: {{accountUrl}}/account/inventory",
    isEnabled: true,
  },
  // ── Wallet ─────────────────────────────────────────────────────
  {
    key: "wallet_credit",
    name: "เติม Wallet สำเร็จ",
    template:
      "💰 เติม Wallet +{{amount}} บาท\n{{description}}\nยอดคงเหลือ: {{balanceAfter}} บาท",
    isEnabled: true,
  },
  // ── Customer Account ──────────────────────────────────────────
  {
    key: "customer_account_processing",
    name: "Customer Account — กำลังดำเนินการ",
    template: "⏳ บัญชีของคุณกำลังดำเนินการ\nบัญชี: {{accountEmail}}\n{{adminNote}}",
    isEnabled: true,
  },
  {
    key: "customer_account_done",
    name: "Customer Account — ใช้งานได้แล้ว",
    template:
      "✅ บัญชีของคุณใช้งานได้แล้ว\nบัญชี: {{accountEmail}}\nรหัสผ่าน: {{accountPassword}}\n{{adminNote}}",
    isEnabled: true,
  },
  // ── Waitlist ──────────────────────────────────────────────────
  {
    key: "waitlist_available",
    name: "Waitlist — Stock มีแล้ว",
    template: '📦 สินค้า "{{productName}}" มี stock ใหม่แล้ว!\nเข้าไปสั่งซื้อได้เลย',
    isEnabled: true,
  },
  // ── Inventory ─────────────────────────────────────────────────
  {
    key: "inventory_expiring",
    name: "Inventory — ใกล้หมดอายุ",
    template:
      "⚠️ {{inventoryTitle}} ใกล้หมดอายุแล้ว\nOrder #{{orderNumber}} จะหมดอายุวันที่ {{expiresAt}} (อีก {{daysLeft}} วัน)",
    isEnabled: true,
  },
  {
    key: "inventory_expired",
    name: "Inventory — หมดอายุแล้ว",
    template:
      "❌ {{inventoryTitle}} หมดอายุแล้ว\nOrder #{{orderNumber}} หมดอายุวันที่ {{expiresAt}} ({{daysSinceExpired}} วันที่แล้ว)\nต่ออายุได้ที่บัญชีของคุณ",
    isEnabled: true,
  },
  // ── Ticket ────────────────────────────────────────────────────
  {
    key: "ticket_created",
    name: "Ticket — แจ้งปัญหาใหม่ (แจ้งลูกค้า)",
    template:
      "📩 ได้รับเรื่องแล้ว #{{ticketId}}\nหัวข้อ: {{subject}}\nทีมงาน {{shopName}} จะดำเนินการโดยเร็ว",
    isEnabled: true,
  },
  {
    key: "ticket_pending",
    name: "Ticket — รอรับเรื่อง",
    template:
      "📋 รอดำเนินการ #{{ticketId}}\nหัวข้อ: {{subject}}\nสถานะ: {{status}}\nทีมงาน {{shopName}} ได้รับเรื่องของคุณแล้ว",
    isEnabled: true,
  },
  {
    key: "ticket_in_progress",
    name: "Ticket — กำลังแก้ไข",
    template:
      "🔧 กำลังดำเนินการ #{{ticketId}}\nหัวข้อ: {{subject}}\nสถานะ: {{status}}\nทีมงาน {{shopName}} กำลังแก้ไขปัญหาของคุณ",
    isEnabled: true,
  },
  {
    key: "ticket_resolved",
    name: "Ticket — แก้ไขเรียบร้อย",
    template:
      "✅ แก้ไขเรียบร้อย #{{ticketId}}\nหัวข้อ: {{subject}}\nสถานะ: {{status}}\nหมายเหตุ: {{adminNote}}\n\nหากยังมีปัญหากรุณาแจ้งอีกครั้ง",
    isEnabled: true,
  },
  {
    key: "ticket_closed",
    name: "Ticket — ปิดเรื่อง",
    template:
      "🔒 ปิดเรื่อง #{{ticketId}}\nหัวข้อ: {{subject}}\nขอบคุณที่ใช้บริการ {{shopName}}",
    isEnabled: true,
  },
];

/** ดึงเทมเพลตทั้งหมด (auto-seed เทมเพลตที่ยังไม่มี) */
export async function listLineTemplates(): Promise<LineTemplateRow[]> {
  const rows = await db
    .select()
    .from(lineMessageTemplates)
    .orderBy(lineMessageTemplates.key);

  const existingKeys = new Set(rows.map((r) => r.key));
  const missing = DEFAULT_TEMPLATES.filter((t) => !existingKeys.has(t.key));

  if (missing.length > 0) {
    await db.insert(lineMessageTemplates).values(missing);
    return db.select().from(lineMessageTemplates).orderBy(lineMessageTemplates.key);
  }

  return rows;
}

/** ดึงเทมเพลตโดย key (fallback text ถ้าไม่มีใน DB) */
export async function getLineTemplate(key: string): Promise<LineTemplateRow | null> {
  const [row] = await db
    .select()
    .from(lineMessageTemplates)
    .where(eq(lineMessageTemplates.key, key))
    .limit(1);

  if (row) return row;

  // fallback: ใช้ default ถ้ายังไม่มีใน DB
  const def = DEFAULT_TEMPLATES.find((t) => t.key === key);
  if (!def) return null;

  const [inserted] = await db
    .insert(lineMessageTemplates)
    .values(def)
    .onConflictDoNothing()
    .returning();
  return inserted ?? null;
}

/** อัปเดตเทมเพลต */
export async function updateLineTemplate(
  id: number,
  data: { template: string; isEnabled: boolean }
) {
  const [updated] = await db
    .update(lineMessageTemplates)
    .set({ template: data.template, isEnabled: data.isEnabled })
    .where(eq(lineMessageTemplates.id, id))
    .returning();
  return updated;
}

/**
 * แทนตัวแปรในเทมเพลต
 * เช่น "สวัสดี {{customerName}}" + { customerName: "สมชาย" } → "สวัสดี สมชาย"
 */
export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}
