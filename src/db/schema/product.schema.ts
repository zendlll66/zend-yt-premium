import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { categories } from "./category.schema";

/** สินค้า/ของเช่า (กล้อง รถ อื่นๆ) - ราคาเป็นต่อวัน */
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  /** ราคาเช่าต่อวัน (บาท) */
  price: real("price").notNull(),
  /** ค่ามัดจำ (บาท) - null = ไม่มี */
  deposit: real("deposit"),
  cost: real("cost"),
  sku: text("sku"),
  barcode: text("barcode"),
  imageUrl: text("image_url"),
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});
