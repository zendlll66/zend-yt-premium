import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { customers } from "./customer.schema";
import { adminUsers } from "./admin-user.schema";
import { orders } from "./order.schema";

/** กระเป๋าเงิน (1 customer = 1 wallet) */
export const customerWallets = sqliteTable("customer_wallets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id")
    .notNull()
    .unique()
    .references(() => customers.id, { onDelete: "cascade" }),
  /** ยอดคงเหลือ (บาท) — ห้ามติดลบ */
  balance: real("balance").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

/** ประเภทธุรกรรมกระเป๋าเงิน */
export const WALLET_TRANSACTION_TYPES = [
  "credit",    // เติมเงิน (admin เติมหรือ refund)
  "debit",     // ใช้จ่าย (checkout)
  "refund",    // คืนเงินจาก order
  "adjustment", // ปรับยอดโดย admin
] as const;
export type WalletTransactionType = (typeof WALLET_TRANSACTION_TYPES)[number];

/** ประวัติธุรกรรมกระเป๋าเงิน */
export const walletTransactions = sqliteTable("wallet_transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  type: text("type", { enum: WALLET_TRANSACTION_TYPES }).notNull(),
  /** จำนวนเงิน (บวก = เพิ่ม, ลบ = ลด) */
  amount: real("amount").notNull(),
  /** ยอดคงเหลือหลังธุรกรรมนี้ */
  balanceAfter: real("balance_after").notNull(),
  /** คำอธิบาย */
  description: text("description").notNull().default(""),
  /** order ที่เกี่ยวข้อง (ถ้ามี) */
  orderId: integer("order_id").references(() => orders.id, {
    onDelete: "set null",
  }),
  /** admin ที่ดำเนินการ (ถ้ามี) */
  createdByAdminId: integer("created_by_admin_id").references(
    () => adminUsers.id,
    { onDelete: "set null" }
  ),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});
