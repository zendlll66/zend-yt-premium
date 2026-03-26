import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { customers } from "./customer.schema";

export const MIGRATION_STOCK_TYPES = ["individual", "family", "invite", "customer_account"] as const;
export type MigrationStockType = (typeof MIGRATION_STOCK_TYPES)[number];

export const MIGRATION_STATUSES = ["pending", "reviewing", "done", "rejected"] as const;
export type MigrationStatus = (typeof MIGRATION_STATUSES)[number];

/** คำขอนำข้อมูลลูกค้าเก่าเข้าระบบ */
export const migrationRequests = sqliteTable("migration_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  /** ลูกค้าที่ login อยู่ตอนกรอก (nullable — กรอกโดยไม่ login ได้) */
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),

  /** อีเมลติดต่อกลับ */
  contactEmail: text("contact_email").notNull(),

  /** ประเภทสินค้า */
  stockType: text("stock_type", { enum: MIGRATION_STOCK_TYPES }).notNull(),

  /** Email ที่ใช้งานใน service เดิม */
  loginEmail: text("login_email").notNull(),

  /** รหัสผ่านที่ใช้งานใน service เดิม (null สำหรับ invite type) */
  loginPassword: text("login_password"),

  /** หมายเหตุเพิ่มเติมจากลูกค้า */
  note: text("note"),

  /** สถานะ: pending → reviewing → done / rejected */
  status: text("status", { enum: MIGRATION_STATUSES }).notNull().default("pending"),

  /** หมายเหตุจาก admin */
  adminNote: text("admin_note"),

  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

export type MigrationRequestRow = typeof migrationRequests.$inferSelect;
