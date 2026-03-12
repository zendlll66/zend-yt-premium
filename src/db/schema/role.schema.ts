import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

/** บทบาทในระบบ (สำหรับแอดมิน/พนักงาน) — ใช้ slug เก็บใน admin_users และ page_roles */
export const roles = sqliteTable("roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});
