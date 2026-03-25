import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { customers } from "./customer.schema";
import { orders } from "./order.schema";

/** ประเภทส่วนลด coupon */
export const COUPON_DISCOUNT_TYPES = ["percent", "fixed"] as const;
export type CouponDiscountType = (typeof COUPON_DISCOUNT_TYPES)[number];

/** Coupon / รหัสส่วนลด */
export const coupons = sqliteTable("coupons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** รหัส coupon (เช่น SAVE10) — case-insensitive ตอนตรวจสอบ */
  code: text("code").notNull().unique(),
  /** ชื่อ/คำอธิบายภายใน */
  name: text("name").notNull(),
  /** ประเภทส่วนลด: percent (%) หรือ fixed (บาท) */
  discountType: text("discount_type", { enum: COUPON_DISCOUNT_TYPES })
    .notNull()
    .default("percent"),
  /** มูลค่าส่วนลด (% หรือบาท ขึ้นอยู่กับ discountType) */
  discountValue: real("discount_value").notNull(),
  /** ยอดขั้นต่ำสำหรับใช้งาน coupon (0 = ไม่มีขั้นต่ำ) */
  minOrderAmount: real("min_order_amount").notNull().default(0),
  /** จำนวนครั้งสูงสุดที่ใช้ได้รวม (null = ไม่จำกัด) */
  maxUses: integer("max_uses"),
  /** จำนวนครั้งที่ใช้ไปแล้ว */
  usedCount: integer("used_count").notNull().default(0),
  /** จำกัดเฉพาะลูกค้า (null = ทุกคน) */
  customerId: integer("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  /** วันหมดอายุ (null = ไม่มีวันหมดอายุ) */
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

/** บันทึกการใช้งาน coupon ต่อ order */
export const couponUsages = sqliteTable("coupon_usages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  couponId: integer("coupon_id")
    .notNull()
    .references(() => coupons.id, { onDelete: "cascade" }),
  customerId: integer("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  orderId: integer("order_id").references(() => orders.id, {
    onDelete: "set null",
  }),
  /** มูลค่าส่วนลดที่ได้รับจริง (บาท) */
  discountAmount: real("discount_amount").notNull(),
  usedAt: integer("used_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});
