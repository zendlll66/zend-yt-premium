import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema/category.schema";

export async function findAllCategories() {
  return db.select().from(categories).orderBy(asc(categories.name));
}

export async function findCategoryById(id: number) {
  const [row] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  return row ?? null;
}

export async function createCategory(data: { name: string }) {
  const [row] = await db.insert(categories).values(data).returning();
  return row ?? null;
}

export async function updateCategory(id: number, data: { name?: string }) {
  const payload: Record<string, unknown> = {};
  if (data.name != null) payload.name = data.name;
  if (Object.keys(payload).length === 0) return findCategoryById(id);
  const [row] = await db
    .update(categories)
    .set(payload as Partial<typeof categories.$inferInsert>)
    .where(eq(categories.id, id))
    .returning();
  return row ?? null;
}

export async function deleteCategoryById(id: number): Promise<boolean> {
  const [row] = await db
    .delete(categories)
    .where(eq(categories.id, id))
    .returning({ id: categories.id });
  return row != null;
}
