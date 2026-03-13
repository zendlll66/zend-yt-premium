import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { orders } from "./order.schema";

/** การชำระเงิน (รองรับหลาย provider / manual payment) */
export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // เช่น stripe, bank_transfer, qr
  transactionId: text("transaction_id"),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("THB"),
  /** pending | paid | failed | refunded */
  status: text("status").notNull().default("pending"),
  paidAt: integer("paid_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

