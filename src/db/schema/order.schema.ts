import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { adminUsers } from "./admin-user.schema";
import { products } from "./product.schema";
import { customers } from "./customer.schema";

/** สถานะคำสั่งซื้อ/เช่า */
export const ORDER_STATUSES = [
  "pending",
  "paid",
  "fulfilled",
  "completed",
  "cancelled",
  "refunded",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type RentalOrderStatus = OrderStatus;

/** ประเภทสินค้า/บริการของออเดอร์ */
export const ORDER_PRODUCT_TYPES = ["individual", "family", "invite", "customer_account"] as const;
export type OrderProductType = (typeof ORDER_PRODUCT_TYPES)[number];

/** คำสั่งซื้อหลัก */
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderNumber: text("order_number").notNull().unique(),
  status: text("status", { enum: ORDER_STATUSES }).notNull().default("pending"),
  /** ประเภทสินค้า: individual, family, invite, customer_account */
  productType: text("product_type", { enum: ORDER_PRODUCT_TYPES }).notNull().default("individual"),
  /** ถ้ามาจากลูกค้าในระบบ LINE จะผูก customerId ไว้ */
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
  totalPrice: real("total_price").notNull(),
  /** ค่ามัดจำรวม (สำหรับ rental เดิม) */
  depositAmount: real("deposit_amount").notNull().default(0),
  /** วันที่เริ่มเช่า (สำหรับ rental) */
  rentalStart: integer("rental_start", { mode: "timestamp" }),
  /** วันที่คืน (สำหรับ rental) */
  rentalEnd: integer("rental_end", { mode: "timestamp" }),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  /** Stripe Payment Intent ID หลังชำระสำเร็จ */
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripePaymentStatus: text("stripe_payment_status"),
  createdBy: integer("created_by").references(() => adminUsers.id, { onDelete: "set null" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

/** วิธีรับสินค้า (ใช้กับ rental เดิม) */
export const DELIVERY_OPTIONS = ["pickup", "delivery"] as const;
export type DeliveryOption = (typeof DELIVERY_OPTIONS)[number];

/** สถานะการจัดส่งต่อรายการ (ใช้ใน order_items) */
export const FULFILLMENT_STATUSES = ["pending", "shipped", "delivered"] as const;
export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

/** รายการในคำสั่งเช่า */
export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  /** ราคาต่อหน่วย (ต่อวัน) */
  price: real("price").notNull(),
  quantity: integer("quantity").notNull(),
  totalPrice: real("total_price").notNull(),
  /** วันรับของรายการนี้ */
  rentalStart: integer("rental_start", { mode: "timestamp" }),
  /** วันคืนของรายการนี้ */
  rentalEnd: integer("rental_end", { mode: "timestamp" }),
  /** รับที่ร้าน (pickup) หรือ ส่ง (delivery) */
  deliveryOption: text("delivery_option", { enum: DELIVERY_OPTIONS }),
  /** สถานะการจัดส่ง/ส่งของ: รอจัดส่ง, ส่งแล้ว, ส่งถึงแล้ว */
  fulfillmentStatus: text("fulfillment_status", { enum: FULFILLMENT_STATUSES }),
  /** เวลาที่อัปเดตสถานะจัดส่งล่าสุด */
  fulfillmentUpdatedAt: integer("fulfillment_updated_at", { mode: "timestamp" }),
});

/** ตัวเลือกเพิ่ม (ประกัน เพิ่มวัน ฯลฯ) - เก็บชื่อ+ราคาต่อรายการ */
export const orderItemModifiers = sqliteTable("order_item_modifiers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderItemId: integer("order_item_id")
    .notNull()
    .references(() => orderItems.id, { onDelete: "cascade" }),
  modifierName: text("modifier_name").notNull(),
  price: real("price").notNull(),
});
