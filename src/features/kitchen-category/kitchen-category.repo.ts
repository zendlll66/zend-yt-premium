import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { kitchenCategories } from "@/db/schema/kitchen-category.schema";

export async function findAllKitchenCategories() {
  return db.select().from(kitchenCategories).orderBy(asc(kitchenCategories.name));
}

export async function findKitchenCategoryById(id: number) {
  const [row] = await db
    .select()
    .from(kitchenCategories)
    .where(eq(kitchenCategories.id, id))
    .limit(1);
  return row ?? null;
}
