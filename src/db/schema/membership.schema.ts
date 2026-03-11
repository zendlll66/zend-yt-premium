import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { customers } from "./customer.schema";

/** ประเภทการคิดเงิน: รายเดือน / รายปี */
export const BILLING_TYPES = ["monthly", "yearly"] as const;
export type BillingType = (typeof BILLING_TYPES)[number];

/** แผนสมาชิก (รายเดือน/รายปี) — ตั้งเงื่อนไขได้ เช่น วันเช่าฟรี ส่วนลด */
export const membershipPlans = sqliteTable("membership_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  /** monthly | yearly */
  billingType: text("billing_type", { enum: BILLING_TYPES }).notNull(),
  /** ราคาต่อช่วง (บาท) */
  price: real("price").notNull(),
  /** ได้วันเช่าฟรี (วัน) — 0 = ไม่มี */
  freeRentalDays: integer("free_rental_days").notNull().default(0),
  /** ส่วนลด % (0–100) — 0 = ไม่มี */
  discountPercent: real("discount_percent").notNull().default(0),
  /** คำอธิบายสิทธิ์ (แสดงให้ลูกค้า) */
  description: text("description"),
  /** เรียงแสดง */
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

/** สถานะการเป็นสมาชิก */
export const MEMBERSHIP_STATUSES = ["active", "expired", "cancelled"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

/** การสมัครสมาชิกของลูกค้า (ผูกกับแผนและช่วงเวลา) */
export const customerMemberships = sqliteTable("customer_memberships", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  planId: integer("plan_id")
    .notNull()
    .references(() => membershipPlans.id, { onDelete: "cascade" }),
  status: text("status", { enum: MEMBERSHIP_STATUSES }).notNull().default("active"),
  /** วันเริ่มใช้สิทธิ์ */
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  /** วันหมดอายุ (หลังวันนี้ถือว่า expired) */
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});
