import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { customers } from "./customer.schema";
import { adminUsers } from "./admin-user.schema";
import { orders } from "./order.schema";

export const TICKET_STATUSES = ["pending", "in_progress", "resolved", "closed"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  pending: "รอรับเรื่อง",
  in_progress: "กำลังแก้ไข",
  resolved: "แก้ไขเรียบร้อย",
  closed: "ปิดเรื่อง",
};

export const supportTickets = sqliteTable("support_tickets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  /** Order ที่มีปัญหา (เลือกได้) */
  orderId: integer("order_id").references(() => orders.id, { onDelete: "set null" }),
  /** หัวข้อปัญหา */
  subject: text("subject").notNull(),
  /** รายละเอียด */
  description: text("description").notNull(),
  status: text("status", { enum: TICKET_STATUSES }).notNull().default("pending"),
  /** หมายเหตุจาก Admin */
  adminNote: text("admin_note"),
  /** Admin ที่รับเรื่อง */
  adminId: integer("admin_id").references(() => adminUsers.id, { onDelete: "set null" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type SupportTicketInsert = typeof supportTickets.$inferInsert;
