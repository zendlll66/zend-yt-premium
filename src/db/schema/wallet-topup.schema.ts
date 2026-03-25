import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { customers } from "./customer.schema";

/** คำขอเติม Wallet ของลูกค้า */
export const walletTopupRequests = sqliteTable("wallet_topup_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  /** stripe = จ่ายผ่าน Stripe (auto confirm), bank = โอนธนาคาร (manual confirm) */
  method: text("method", { enum: ["stripe", "bank"] }).notNull(),
  /** pending = รอดำเนินการ, approved = อนุมัติแล้ว, rejected = ปฏิเสธ */
  status: text("status", { enum: ["pending", "approved", "rejected"] })
    .notNull()
    .default("pending"),
  /** Stripe Checkout Session ID (สำหรับ method=stripe) */
  stripeSessionId: text("stripe_session_id"),
  /** URL รูปสลิปที่อัปโหลด (สำหรับ method=bank) */
  slipImageUrl: text("slip_image_url"),
  /** หมายเหตุจากแอดมิน */
  adminNote: text("admin_note"),
  /** แอดมินที่ approve/reject */
  approvedByAdminId: integer("approved_by_admin_id"),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});
