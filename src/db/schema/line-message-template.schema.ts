import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

/**
 * ตัวแปรที่ใช้ได้ในเทมเพลต LINE — แสดงใน UI เพื่อให้ admin drag มาใช้
 */
export const LINE_TEMPLATE_VARIABLES = [
  // ลูกค้า
  { key: "customerName", label: "ชื่อลูกค้า", group: "ลูกค้า" },
  { key: "customerEmail", label: "อีเมลลูกค้า", group: "ลูกค้า" },
  // Order
  { key: "orderNumber", label: "หมายเลข Order", group: "Order" },
  { key: "totalPrice", label: "ยอดรวม (บาท)", group: "Order" },
  { key: "productName", label: "ชื่อสินค้า", group: "Order" },
  // Wallet
  { key: "amount", label: "จำนวนเงิน (บาท)", group: "Wallet" },
  { key: "balanceAfter", label: "ยอดคงเหลือ (บาท)", group: "Wallet" },
  { key: "description", label: "รายละเอียด", group: "Wallet" },
  // Inventory
  { key: "inventoryTitle", label: "ชื่อ Inventory", group: "Inventory" },
  { key: "expiresAt", label: "วันหมดอายุ", group: "Inventory" },
  { key: "daysLeft", label: "วันที่เหลือ", group: "Inventory" },
  { key: "daysSinceExpired", label: "วันที่ผ่านไปหลังหมดอายุ", group: "Inventory" },
  // Customer Account
  { key: "accountEmail", label: "อีเมล Account", group: "Account" },
  { key: "accountPassword", label: "รหัสผ่าน Account", group: "Account" },
  { key: "adminNote", label: "หมายเหตุจาก Admin", group: "Account" },
  // Ticket
  { key: "ticketId", label: "หมายเลข Ticket", group: "Ticket" },
  { key: "subject", label: "หัวข้อปัญหา", group: "Ticket" },
  { key: "status", label: "สถานะ (ภาษาไทย)", group: "Ticket" },
  // ร้าน / ทั่วไป
  { key: "shopName", label: "ชื่อร้าน", group: "ทั่วไป" },
  { key: "accountUrl", label: "URL บัญชีลูกค้า", group: "ทั่วไป" },
  { key: "date", label: "วันที่", group: "ทั่วไป" },
  { key: "time", label: "เวลา", group: "ทั่วไป" },
  { key: "year", label: "ปี พ.ศ.", group: "ทั่วไป" },
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
