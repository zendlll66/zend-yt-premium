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

export async function createKitchenCategory(data: { name: string }) {
  const [row] = await db.insert(kitchenCategories).values(data).returning();
  return row ?? null;
}

export async function updateKitchenCategory(id: number, data: { name?: string }) {
  const payload: Record<string, unknown> = {};
  if (data.name != null) payload.name = data.name;
  if (Object.keys(payload).length === 0) return findKitchenCategoryById(id);
  const [row] = await db
    .update(kitchenCategories)
    .set(payload as { name?: string })
    .where(eq(kitchenCategories.id, id))
    .returning();
  return row ?? null;
}

export async function deleteKitchenCategoryById(id: number): Promise<boolean> {
  const [row] = await db
    .delete(kitchenCategories)
    .where(eq(kitchenCategories.id, id))
    .returning({ id: kitchenCategories.id });
  return row != null;
}
