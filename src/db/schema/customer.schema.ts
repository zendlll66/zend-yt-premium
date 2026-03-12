import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

/** ลูกค้า — เข้าสู่ระบบด้วย LINE LIFF (auto regis/login) หรืออีเมล (legacy) */
export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** LINE User ID จาก id_token (sub) — ใช้สำหรับ LINE login */
  lineUserId: text("line_user_id").unique(),
  lineDisplayName: text("line_display_name"),
  linePictureUrl: text("line_picture_url"),
  name: text("name").notNull(),
  /** อีเมล (สำหรับ LINE-only ใช้ placeholder line-{lineUserId}@liff จนกว่าจะเพิ่มในโปรไฟล์) */
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});
