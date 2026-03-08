import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { adminUsers } from "./admin-user.schema";
import { products } from "./product.schema";
import { tables } from "./table.schema";

export const ORDER_STATUSES = ["pending", "preparing", "ready", "served", "paid", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tableId: integer("table_id").references(() => tables.id, { onDelete: "set null" }),
  orderNumber: text("order_number").notNull().unique(),
  status: text("status", { enum: ORDER_STATUSES }).notNull().default("pending"),
  totalPrice: real("total_price").notNull(),
  createdBy: integer("created_by").references(() => adminUsers.id, { onDelete: "set null" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  price: real("price").notNull(),
  quantity: integer("quantity").notNull(),
  totalPrice: real("total_price").notNull(),
});

export const orderItemModifiers = sqliteTable("order_item_modifiers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderItemId: integer("order_item_id")
    .notNull()
    .references(() => orderItems.id, { onDelete: "cascade" }),
  modifierName: text("modifier_name").notNull(),
  price: real("price").notNull(),
});
