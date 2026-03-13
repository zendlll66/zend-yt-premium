import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { customers } from "./customer.schema";

/** บัญชีที่ลูกค้าเอามาให้ร้านจัดการสมัคร Premium ให้ */
export const customerAccounts = sqliteTable("customer_accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  password: text("password").notNull(),
  orderId: integer("order_id").notNull(),
  /** pending, processing, done */
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

