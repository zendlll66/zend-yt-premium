import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { categories } from "./category.schema";

export const PRODUCT_STOCK_TYPES = ["individual", "family", "invite", "customer_account"] as const;
export type ProductStockType = (typeof PRODUCT_STOCK_TYPES)[number];

/** สินค้า/แพ็กเกจ */
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  /** ราคาขาย */
  price: real("price").notNull(),
  /** ราคาเดิม (ถ้ามี) */
  deposit: real("deposit"),
  cost: real("cost"),
  sku: text("sku"),
  barcode: text("barcode"),
  imageUrl: text("image_url"),
  description: text("description"),
  /** อายุแพ็กเกจ (วัน) เช่น 30 / 90 / 365 */
  durationDays: integer("duration_days").notNull().default(30),
  /** ประเภท stock ที่จะใช้ตอนจ่ายเงิน/assign stock */
  stockType: text("stock_type", { enum: PRODUCT_STOCK_TYPES }).notNull().default("individual"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});
