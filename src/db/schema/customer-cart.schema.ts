import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { customers } from "./customer.schema";
import { products } from "./product.schema";

/** ตัวเลือกการรับสินค้า */
export const CART_DELIVERY_OPTIONS = ["pickup", "delivery"] as const;
export type CartDeliveryOption = (typeof CART_DELIVERY_OPTIONS)[number];

/** รายการในตะกร้าของลูกค้า (เก็บใน DB ต่อ customer) */
export const customerCartItems = sqliteTable("customer_cart_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  price: real("price").notNull(),
  quantity: integer("quantity").notNull(),
  /** JSON array: [{ modifierName, price }] */
  modifiersJson: text("modifiers_json").notNull().default("[]"),
  /** วันรับ YYYY-MM-DD */
  rentalStart: text("rental_start").notNull(),
  /** วันคืน YYYY-MM-DD */
  rentalEnd: text("rental_end").notNull(),
  deliveryOption: text("delivery_option", { enum: CART_DELIVERY_OPTIONS }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});
