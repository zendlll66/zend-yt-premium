import { sqliteTable, integer, text, real, primaryKey } from "drizzle-orm/sqlite-core";
import { products } from "./product.schema";

/** โปรโมชันลดราคา — ตั้ง % และช่วงเวลา ได้หลายสินค้าต่อหนึ่งโปร */
export const promotions = sqliteTable("promotions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** ชื่อโปร (เช่น "ลดเปิดร้าน") */
  name: text("name").notNull(),
  /** ส่วนลด % (0–100) */
  discountPercent: real("discount_percent").notNull(),
  /** เริ่มต้น */
  startAt: integer("start_at", { mode: "timestamp" }).notNull(),
  /** สิ้นสุด */
  endAt: integer("end_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

/** สินค้าที่เข้าร่วมโปร (many-to-many) */
export const promotionProducts = sqliteTable(
  "promotion_products",
  {
    promotionId: integer("promotion_id")
      .notNull()
      .references(() => promotions.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.promotionId, t.productId] }) })
);
