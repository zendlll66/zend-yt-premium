import { sqliteTable, integer, text, real, uniqueIndex } from "drizzle-orm/sqlite-core";
import { products } from "./product.schema";

export const modifierGroups = sqliteTable("modifier_groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  required: integer("required", { mode: "boolean" }).notNull().default(false),
});

export const modifiers = sqliteTable("modifiers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  groupId: integer("group_id")
    .notNull()
    .references(() => modifierGroups.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  price: real("price").notNull().default(0),
});

export const productModifiers = sqliteTable(
  "product_modifiers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    modifierGroupId: integer("modifier_group_id")
      .notNull()
      .references(() => modifierGroups.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("product_modifiers_product_group").on(t.productId, t.modifierGroupId)]
);
