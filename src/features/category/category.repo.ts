import { asc, eq } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { db } from "@/db";
import { categories } from "@/db/schema/category.schema";

type CategoryRow = {
  id: number;
  name: string;
  imageUrl: string | null;
  detail: string | null;
  createdAt: Date | null;
};

type CategoryColumnSupport = {
  imageUrl: boolean;
  detail: boolean;
};

let categoryColumnSupportCache: CategoryColumnSupport | null = null;

const categoriesLegacy = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

async function getCategoryColumnSupport(): Promise<CategoryColumnSupport> {
  if (categoryColumnSupportCache) return categoryColumnSupportCache;
  try {
    const client = (db as unknown as { $client?: { execute?: (query: string) => Promise<{ rows?: Array<Record<string, unknown>> }> } }).$client;
    if (!client?.execute) throw new Error("DB_CLIENT_EXECUTE_NOT_AVAILABLE");
    const result = await client.execute('PRAGMA table_info("categories")');
    const rows = (result.rows ?? []) as Array<Record<string, unknown>>;
    const names = new Set(rows.map((r) => String(r.name ?? "")));
    categoryColumnSupportCache = {
      imageUrl: names.has("image_url"),
      detail: names.has("detail"),
    };
    return categoryColumnSupportCache;
  } catch {
    categoryColumnSupportCache = { imageUrl: false, detail: false };
    return categoryColumnSupportCache;
  }
}

export async function findAllCategories() {
  const columnSupport = await getCategoryColumnSupport();
  if (columnSupport.imageUrl && columnSupport.detail) {
    return db.select().from(categories).orderBy(asc(categories.name));
  }

  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      createdAt: categories.createdAt,
    })
    .from(categories)
    .orderBy(asc(categories.name));

  return rows.map(
    (r): CategoryRow => ({
      id: r.id,
      name: r.name,
      imageUrl: null,
      detail: null,
      createdAt: r.createdAt,
    })
  );
}

export async function findCategoryById(id: number) {
  const columnSupport = await getCategoryColumnSupport();
  if (columnSupport.imageUrl && columnSupport.detail) {
    const [row] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    return row ?? null;
  }

  const [row] = await db
    .select({
      id: categories.id,
      name: categories.name,
      createdAt: categories.createdAt,
    })
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    imageUrl: null,
    detail: null,
    createdAt: row.createdAt,
  } satisfies CategoryRow;
}

export async function createCategory(data: {
  name: string;
  imageUrl?: string | null;
  detail?: string | null;
}) {
  const columnSupport = await getCategoryColumnSupport();
  if (columnSupport.imageUrl && columnSupport.detail) {
    const [row] = await db.insert(categories).values(data).returning();
    return row ?? null;
  }

  const [row] = await db
    .insert(categoriesLegacy)
    .values({ name: data.name, createdAt: new Date() })
    .returning({
      id: categoriesLegacy.id,
      name: categoriesLegacy.name,
      createdAt: categoriesLegacy.createdAt,
    });
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    imageUrl: null,
    detail: null,
    createdAt: row.createdAt,
  } satisfies CategoryRow;
}

export async function updateCategory(
  id: number,
  data: { name?: string; imageUrl?: string | null; detail?: string | null }
) {
  const columnSupport = await getCategoryColumnSupport();
  const payload: Record<string, unknown> = {};
  if (data.name != null) payload.name = data.name;
  if (columnSupport.imageUrl && data.imageUrl !== undefined) payload.imageUrl = data.imageUrl;
  if (columnSupport.detail && data.detail !== undefined) payload.detail = data.detail;
  if (Object.keys(payload).length === 0) return findCategoryById(id);
  const [row] =
    columnSupport.imageUrl && columnSupport.detail
      ? await db
          .update(categories)
          .set(payload as Partial<typeof categories.$inferInsert>)
          .where(eq(categories.id, id))
          .returning()
      : await db
          .update(categories)
          .set(payload as Partial<typeof categories.$inferInsert>)
          .where(eq(categories.id, id))
          .returning({
            id: categories.id,
            name: categories.name,
            createdAt: categories.createdAt,
          });
  return row ?? null;
}

export async function deleteCategoryById(id: number): Promise<boolean> {
  const [row] = await db
    .delete(categories)
    .where(eq(categories.id, id))
    .returning({ id: categories.id });
  return row != null;
}
