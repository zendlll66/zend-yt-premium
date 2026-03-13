import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { customers } from "./customer.schema";
import { orders } from "./order.schema";

export const INVENTORY_ITEM_TYPES = ["individual", "family", "invite", "customer_account"] as const;
export type InventoryItemType = (typeof INVENTORY_ITEM_TYPES)[number];

/** ข้อมูลที่ส่งมอบให้ลูกค้าหลังจ่ายเงิน สำรองไว้เปิดดูย้อนหลัง */
export const customerInventories = sqliteTable("customer_inventories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  itemType: text("item_type", { enum: INVENTORY_ITEM_TYPES }).notNull(),
  title: text("title").notNull(),
  loginEmail: text("login_email"),
  loginPassword: text("login_password"),
  inviteLink: text("invite_link"),
  durationDays: integer("duration_days").notNull().default(30),
  activatedAt: integer("activated_at", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  note: text("note"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

