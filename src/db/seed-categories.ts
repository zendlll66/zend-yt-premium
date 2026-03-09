import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema/category.schema";

/** หมวดหมู่สำหรับระบบเช่า: กล้อง รถ อื่นๆ */
const RENTAL_CATEGORIES = ["กล้อง", "รถ", "อื่นๆ"];

async function seedCategories() {
  for (const name of RENTAL_CATEGORIES) {
    const [existing] = await db
      .select()
      .from(categories)
      .where(eq(categories.name, name))
      .limit(1);
    if (existing) continue;
    await db.insert(categories).values({ name });
    console.log("  + หมวดหมู่:", name);
  }
  console.log("Seed categories done.");
}

seedCategories().catch((e) => {
  console.error("Seed categories failed:", e);
  process.exit(1);
});
