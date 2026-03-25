import { db } from "@/db";
import { lineMessageTemplates } from "@/db/schema/line-message-template.schema";
import { eq } from "drizzle-orm";

export type LineTemplateRow = typeof lineMessageTemplates.$inferSelect;

const DEFAULT_TEMPLATES = [
  {
    key: "ticket_created",
    name: "แจ้งปัญหาใหม่ (แจ้งลูกค้า)",
    template:
      "📩 ได้รับเรื่องแล้ว #{{ticketId}}\nหัวข้อ: {{subject}}\nทีมงาน {{shopName}} จะดำเนินการโดยเร็ว",
    isEnabled: true,
  },
  {
    key: "ticket_pending",
    name: "รอรับเรื่อง (แจ้งลูกค้า)",
    template:
      "📋 รอดำเนินการ #{{ticketId}}\nหัวข้อ: {{subject}}\nสถานะ: {{status}}\nทีมงาน {{shopName}} ได้รับเรื่องของคุณแล้ว",
    isEnabled: true,
  },
  {
    key: "ticket_in_progress",
    name: "กำลังแก้ไข (แจ้งลูกค้า)",
    template:
      "🔧 กำลังดำเนินการ #{{ticketId}}\nหัวข้อ: {{subject}}\nสถานะ: {{status}}\nทีมงาน {{shopName}} กำลังแก้ไขปัญหาของคุณ",
    isEnabled: true,
  },
  {
    key: "ticket_resolved",
    name: "แก้ไขเรียบร้อย (แจ้งลูกค้า)",
    template:
      "✅ แก้ไขเรียบร้อย #{{ticketId}}\nหัวข้อ: {{subject}}\nสถานะ: {{status}}\nหมายเหตุ: {{adminNote}}\n\nหากยังมีปัญหากรุณาแจ้งอีกครั้ง",
    isEnabled: true,
  },
  {
    key: "ticket_closed",
    name: "ปิดเรื่อง (แจ้งลูกค้า)",
    template:
      "🔒 ปิดเรื่อง #{{ticketId}}\nหัวข้อ: {{subject}}\nขอบคุณที่ใช้บริการ {{shopName}}",
    isEnabled: true,
  },
] as const;

/** ดึงเทมเพลตทั้งหมด (auto-seed ถ้าว่าง) */
export async function listLineTemplates(): Promise<LineTemplateRow[]> {
  const rows = await db
    .select()
    .from(lineMessageTemplates)
    .orderBy(lineMessageTemplates.key);

  if (rows.length === 0) {
    await db.insert(lineMessageTemplates).values(DEFAULT_TEMPLATES.map((t) => ({ ...t })));
    return db.select().from(lineMessageTemplates).orderBy(lineMessageTemplates.key);
  }

  return rows;
}

/** ดึงเทมเพลตโดย key */
export async function getLineTemplate(key: string): Promise<LineTemplateRow | null> {
  const [row] = await db
    .select()
    .from(lineMessageTemplates)
    .where(eq(lineMessageTemplates.key, key))
    .limit(1);
  return row ?? null;
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
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}
