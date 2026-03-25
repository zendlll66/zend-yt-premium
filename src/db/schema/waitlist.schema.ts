import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { products } from "./product.schema";
import { customers } from "./customer.schema";

/** สถานะ Waitlist */
export const WAITLIST_STATUSES = ["waiting", "notified", "cancelled"] as const;
export type WaitlistStatus = (typeof WAITLIST_STATUSES)[number];

/** รายชื่อลูกค้าที่รอสินค้าหมด stock */
export const productWaitlist = sqliteTable("product_waitlist", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  status: text("status", { enum: WAITLIST_STATUSES })
    .notNull()
    .default("waiting"),
  /** วันที่แจ้งเตือนครั้งล่าสุด */
  notifiedAt: integer("notified_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});
