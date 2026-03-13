import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { customers } from "./customer.schema";

/** กลุ่ม Family Plan (หนึ่งกลุ่มขายได้หลาย slot) */
export const familyGroups = sqliteTable("family_groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  /** บัญชีหัวกลุ่ม (owner) ของ Family */
  headEmail: text("head_email"),
  headPassword: text("head_password"),
  /** จำนวนสมาชิกสูงสุดใน family นี้ */
  limit: integer("limit").notNull(),
  /** จำนวนที่ใช้ไปแล้ว (ควรอัปเดตแบบ transaction) */
  used: integer("used").notNull().default(0),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

/** สมาชิกใน Family (ผูกกับ order และ/หรือ customer) */
export const familyMembers = sqliteTable("family_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  familyGroupId: integer("family_group_id")
    .notNull()
    .references(() => familyGroups.id, { onDelete: "cascade" }),
  customerId: integer("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  /** อีเมลที่ใช้ใน family (อาจต่างจากอีเมล LINE) */
  email: text("email").notNull(),
  /** รหัสผ่าน/ข้อมูลเข้าใช้งานที่ส่งมอบให้ลูกค้า */
  memberPassword: text("member_password"),
  /** อ้างอิง order ที่ทำให้ได้ slot นี้ */
  orderId: integer("order_id"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

