import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { adminUsers } from "./admin-user.schema";
import { products } from "./product.schema";
import { tables } from "./table.schema";

/** สถานะระดับบิล (open = หนึ่งใน pending/preparing/ready/served) */
export const BILL_STATUSES = ["open", "paid", "cancelled"] as const;
export type BillStatus = (typeof BILL_STATUSES)[number];

/** สถานะระดับรายการสั่งครัว */
export const KITCHEN_ORDER_STATUSES = ["pending", "preparing", "ready", "served"] as const;
export type KitchenOrderStatus = (typeof KITCHEN_ORDER_STATUSES)[number];

const ORDER_STATUSES_LEGACY = ["pending", "preparing", "ready", "served", "paid", "cancelled"] as const;

/** บิล (status ระดับบิล: paid/cancelled หรือ open = ยังไม่จ่าย) */
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tableId: integer("table_id").references(() => tables.id, { onDelete: "set null" }),
  orderNumber: text("order_number").notNull().unique(),
  status: text("status", { enum: ORDER_STATUSES_LEGACY }).notNull().default("pending"),
  totalPrice: real("total_price").notNull(),
  createdBy: integer("created_by").references(() => adminUsers.id, { onDelete: "set null" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

/** รายการสั่งครัว (1 บิลมีได้หลาย order) */
export const kitchenOrders = sqliteTable("kitchen_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  status: text("status", { enum: KITCHEN_ORDER_STATUSES }).notNull().default("pending"),
  sequence: integer("sequence").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

/** สถานะต่อรายการ (แต่ละ station จัดเตรียมแยกได้) */
export const ORDER_ITEM_STATUSES = ["pending", "preparing", "ready"] as const;
export type OrderItemStatus = (typeof ORDER_ITEM_STATUSES)[number];

/** รายการสินค้าในรายการสั่งครัว (อ้างอิง kitchen_orders; เก็บ order_id ไว้ชั่วคราวสำหรับ migrate) */
export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "cascade" }),
  kitchenOrderId: integer("kitchen_order_id").references(() => kitchenOrders.id, {
    onDelete: "cascade",
  }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  price: real("price").notNull(),
  quantity: integer("quantity").notNull(),
  totalPrice: real("total_price").notNull(),
  /** สถานะต่อรายการ (แต่ละ station เสร็จไม่พร้อมกันได้) */
  status: text("status", { enum: ORDER_ITEM_STATUSES }).notNull().default("pending"),
});

export const orderItemModifiers = sqliteTable("order_item_modifiers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderItemId: integer("order_item_id")
    .notNull()
    .references(() => orderItems.id, { onDelete: "cascade" }),
  modifierName: text("modifier_name").notNull(),
  price: real("price").notNull(),
});
