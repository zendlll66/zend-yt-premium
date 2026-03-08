import { sqliteTable, integer, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const ROLES = ["super_admin", "admin", "cashier", "chef"] as const;

export const pages = sqliteTable("pages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  path: text("path").notNull().unique(),
  label: text("label").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

export const pageRoles = sqliteTable(
  "page_roles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    pageId: integer("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    role: text("role", { enum: ROLES }).notNull(),
  },
  (t) => [uniqueIndex("page_roles_page_id_role").on(t.pageId, t.role)]
);
