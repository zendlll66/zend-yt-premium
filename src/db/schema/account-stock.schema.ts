import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { customers } from "./customer.schema";

/** สต็อกรหัสแบบ Individual (1 account ต่อ 1 ลูกค้า) */
export const accountStock = sqliteTable("account_stock", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** อีเมล / username สำหรับใช้ล็อกอิน YouTube หรือบริการที่ขาย */
  email: text("email").notNull(),
  /** รหัสผ่าน (เก็บเข้ารหัสฝั่งระบบเก็บรหัสจริง, หรือเก็บ plain ถ้าเป็นรหัสชั่วคราว) */
  password: text("password").notNull(),
  /** สถานะสต็อก: available, reserved, sold */
  status: text("status").notNull().default("available"),
  /** ผูกกับออเดอร์ที่ขายแล้ว (ถ้ามี) */
  orderId: integer("order_id"),
  /** ลูกค้าที่ได้รับรหัสนี้ (เก็บตอนจ่ายเงินแล้ว assign stock ให้) */
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
  /** เวลาเริ่มจอง (ใช้ป้องกันจองค้าง) */
  reservedAt: integer("reserved_at", { mode: "timestamp" }),
  /** เวลาที่ขายแล้ว */
  soldAt: integer("sold_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

