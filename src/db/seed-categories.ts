import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema/category.schema";

const DEFAULT_CATEGORIES = ["เครื่องดื่ม", "ของว่าง", "ของใช้"];

async function seedCategories() {
  for (const name of DEFAULT_CATEGORIES) {
    const [existing] = await db
      .select()
      .from(categories)
      .where(eq(categories.name, name))
      .limit(1);
    if (existing) continue;
    await db.insert(categories).values({ name });
    console.log("Added category:", name);
  }
  console.log("Seed categories done.");
}

seedCategories().catch((e) => {
  console.error("Seed categories failed:", e);
  process.exit(1);
});
