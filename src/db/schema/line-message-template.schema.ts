import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

/**
 * ตัวแปรที่ใช้ได้ในเทมเพลต LINE — แสดงใน UI เพื่อให้ admin drag มาใช้
 */
export const LINE_TEMPLATE_VARIABLES = [
  { key: "customerName", label: "ชื่อลูกค้า" },
  { key: "ticketId", label: "หมายเลข Ticket" },
  { key: "subject", label: "หัวข้อปัญหา" },
  { key: "status", label: "สถานะ (ภาษาไทย)" },
  { key: "orderNumber", label: "หมายเลข Order" },
  { key: "productName", label: "ชื่อสินค้า" },
  { key: "adminNote", label: "หมายเหตุจาก Admin" },
  { key: "shopName", label: "ชื่อร้าน" },
  { key: "date", label: "วันที่" },
  { key: "time", label: "เวลา" },
  { key: "year", label: "ปี" },
] as const;

export type LineTemplateVariableKey = (typeof LINE_TEMPLATE_VARIABLES)[number]["key"];

/** เทมเพลตข้อความ LINE (admin ตั้งค่าได้) */
export const lineMessageTemplates = sqliteTable("line_message_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** key ไม่ซ้ำ เช่น "ticket_created", "ticket_in_progress" */
  key: text("key").notNull().unique(),
  /** ชื่อที่แสดงใน UI */
  name: text("name").notNull(),
  /** เนื้อหาเทมเพลต มีตัวแปร {{variableName}} */
  template: text("template").notNull(),
  /** เปิด/ปิดการส่ง */
  isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

export type LineMessageTemplate = typeof lineMessageTemplates.$inferSelect;
