import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const TABLE_STATUSES = ["available", "occupied", "reserved", "cleaning"] as const;
export type TableStatus = (typeof TABLE_STATUSES)[number];

export const tables = sqliteTable("tables", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tableNumber: text("table_number").notNull().unique(),
  status: text("status", { enum: TABLE_STATUSES }).notNull().default("available"),
  capacity: integer("capacity").notNull().default(4),
  qrToken: text("qr_token").unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});
