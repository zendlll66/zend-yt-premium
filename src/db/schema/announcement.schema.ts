import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const announcements = sqliteTable("announcements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  /** HTML content from WYSIWYG editor */
  content: text("content").notNull().default(""),
  isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(true),
  /** วันเริ่มแสดง (null = แสดงทันที) */
  startsAt: integer("starts_at", { mode: "timestamp" }),
  /** วันสิ้นสุด (null = ไม่มีกำหนด) */
  endsAt: integer("ends_at", { mode: "timestamp" }),
  /** ลำดับการแสดงใน carousel */
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

export type Announcement = typeof announcements.$inferSelect;
export type AnnouncementInsert = typeof announcements.$inferInsert;
