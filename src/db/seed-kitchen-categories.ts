import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { kitchenCategories } from "@/db/schema/kitchen-category.schema";

const DEFAULT_STATIONS = ["Drink", "Food", "Dessert", "Bar"];

async function seedKitchenCategories() {
  for (const name of DEFAULT_STATIONS) {
    const [existing] = await db
      .select()
      .from(kitchenCategories)
      .where(eq(kitchenCategories.name, name))
      .limit(1);
    if (existing) continue;
    await db.insert(kitchenCategories).values({ name });
    console.log("  +", name);
  }
  console.log("Seed kitchen categories done.");
}

seedKitchenCategories().catch((e) => {
  console.error("Seed kitchen categories failed:", e);
  process.exit(1);
});
