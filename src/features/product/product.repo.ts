import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema/product.schema";
import { categories } from "@/db/schema/category.schema";

export type ProductListItem = {
  id: number;
  name: string;
  categoryId: number | null;
  categoryName: string | null;
  price: number;
  cost: number | null;
  sku: string | null;
  barcode: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: Date | null;
};

export async function findAllProducts(): Promise<ProductListItem[]> {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      categoryId: products.categoryId,
      categoryName: categories.name,
      price: products.price,
      cost: products.cost,
      sku: products.sku,
      barcode: products.barcode,
      imageUrl: products.imageUrl,
      isActive: products.isActive,
      createdAt: products.createdAt,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(desc(products.createdAt));
  return rows.map((r) => ({
    ...r,
    categoryName: r.categoryName ?? null,
  }));
}

export async function findProductById(id: number) {
  const [row] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  return row ?? null;
}

export async function createProduct(data: {
  name: string;
  categoryId?: number | null;
  price: number;
  cost?: number | null;
  sku?: string | null;
  barcode?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
}) {
  const [row] = await db
    .insert(products)
    .values({
      name: data.name,
      categoryId: data.categoryId ?? null,
      price: data.price,
      cost: data.cost ?? null,
      sku: data.sku ?? null,
      barcode: data.barcode ?? null,
      imageUrl: data.imageUrl ?? null,
      isActive: data.isActive ?? true,
    })
    .returning();
  return row ?? null;
}

export async function updateProduct(
  id: number,
  data: {
    name?: string;
    categoryId?: number | null;
    price?: number;
    cost?: number | null;
    sku?: string | null;
    barcode?: string | null;
    imageUrl?: string | null;
    isActive?: boolean;
  }
) {
  const payload: Record<string, unknown> = { ...data };
  if (Object.keys(payload).length === 0) return findProductById(id);
  const [row] = await db
    .update(products)
    .set(payload as Partial<typeof products.$inferInsert>)
    .where(eq(products.id, id))
    .returning();
  return row ?? null;
}

export async function deleteProductById(id: number): Promise<boolean> {
  const [row] = await db
    .delete(products)
    .where(eq(products.id, id))
    .returning({ id: products.id });
  return row != null;
}

export async function setProductActive(id: number, isActive: boolean) {
  const [row] = await db
    .update(products)
    .set({ isActive })
    .where(eq(products.id, id))
    .returning();
  return row ?? null;
}
