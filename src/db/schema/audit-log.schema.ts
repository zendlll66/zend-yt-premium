import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { adminUsers } from "./admin-user.schema";

/** บันทึกการใช้งาน (Audit log) — ใครทำอะไรเมื่อไหร่ */
export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** ผู้ทำ (null = ระบบ) */
  adminUserId: integer("admin_user_id").references(() => adminUsers.id, { onDelete: "set null" }),
  /** การกระทำ เช่น order.update, product.update, order.cancel */
  action: text("action").notNull(),
  /** ประเภท entity เช่น order, product, customer */
  entityType: text("entity_type").notNull(),
  /** รหัส entity (เก็บเป็น text เพื่อความยืดหยุ่น) */
  entityId: text("entity_id"),
  /** รายละเอียดเพิ่มเติม (JSON หรือข้อความ) */
  details: text("details"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});
