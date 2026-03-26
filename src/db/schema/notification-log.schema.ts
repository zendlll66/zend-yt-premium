import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { customers } from "./customer.schema";
import { orders } from "./order.schema";

/** ประเภท notification */
export const NOTIFICATION_TYPES = [
  "order_confirm",      // ยืนยัน order ใหม่
  "order_paid",         // ชำระเงินสำเร็จ
  "order_fulfilled",    // ส่งมอบ credentials แล้ว
  "order_cancelled",    // order ถูกยกเลิก
  "inventory_expiring", // inventory ใกล้หมดอายุ
  "inventory_expired",  // inventory หมดอายุแล้ว
  "waitlist_available", // สินค้า waitlist มี stock แล้ว
  "wallet_credit",      // เติม wallet
  "wallet_debit",       // ใช้ wallet
  "bulk_notify",        // ส่งข้อความหาลูกค้าจาก admin
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** ช่องทางแจ้งเตือน */
export const NOTIFICATION_CHANNELS = ["line", "email"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

/** สถานะการส่ง */
export const NOTIFICATION_STATUSES = ["sent", "failed", "skipped"] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

/** ประวัติการส่ง notification */
export const notificationLogs = sqliteTable("notification_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type", { enum: NOTIFICATION_TYPES }).notNull(),
  channel: text("channel", { enum: NOTIFICATION_CHANNELS }).notNull(),
  /** email หรือ LINE userId */
  recipient: text("recipient").notNull(),
  customerId: integer("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  orderId: integer("order_id").references(() => orders.id, {
    onDelete: "set null",
  }),
  /** หัวข้อ (สำหรับ email) */
  subject: text("subject"),
  /** เนื้อหาที่ส่งไป */
  content: text("content").notNull(),
  status: text("status", { enum: NOTIFICATION_STATUSES }).notNull(),
  /** ข้อผิดพลาด (ถ้า status = failed) */
  error: text("error"),
  sentAt: integer("sent_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});
