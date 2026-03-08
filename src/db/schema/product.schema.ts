import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { categories } from "./category.schema";

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  price: real("price").notNull(),
  cost: real("cost"),
  sku: text("sku"),
  barcode: text("barcode"),
  imageUrl: text("image_url"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});
