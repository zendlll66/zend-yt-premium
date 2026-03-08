import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const kitchenCategories = sqliteTable("kitchen_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
});
