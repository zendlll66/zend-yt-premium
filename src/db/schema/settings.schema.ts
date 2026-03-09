import { sqliteTable, text } from "drizzle-orm/sqlite-core";

/** ตั้งค่าร้าน (key-value) */
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
});

export type Setting = typeof settings.$inferSelect;
export type SettingInsert = typeof settings.$inferInsert;
