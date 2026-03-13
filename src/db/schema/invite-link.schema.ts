import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

/** ลิงก์เชิญ (Invite Link) สำหรับแผนที่ใช้ลิงก์แทน account โดยตรง */
export const inviteLinks = sqliteTable("invite_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  link: text("link").notNull(),
  /** สถานะ: available, reserved, used */
  status: text("status").notNull().default("available"),
  orderId: integer("order_id"),
  reservedAt: integer("reserved_at", { mode: "timestamp" }),
  usedAt: integer("used_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

