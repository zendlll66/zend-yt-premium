import { desc, eq } from "drizzle-orm";
import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { db } from "@/db";
import { products } from "@/db/schema/product.schema";
import { categories } from "@/db/schema/category.schema";
import type { ProductStockType } from "@/db/schema/product.schema";

export type ProductListItem = {
  id: number;
  name: string;
  categoryId: number | null;
  categoryName: string | null;
  price: number;
  deposit: number | null;
  cost: number | null;
  sku: string | null;
  barcode: string | null;
  imageUrl: string | null;
  description: string | null;
  durationDays: number;
  stockType: ProductStockType;
  isActive: boolean;
  createdAt: Date | null;
};

const productListSelect = {
  id: products.id,
  name: products.name,
  categoryId: products.categoryId,
  categoryName: categories.name,
  price: products.price,
  deposit: products.deposit,
  cost: products.cost,
  sku: products.sku,
  barcode: products.barcode,
  imageUrl: products.imageUrl,
  description: products.description,
  durationDays: products.durationDays,
  stockType: products.stockType,
  isActive: products.isActive,
  createdAt: products.createdAt,
};

const productsLegacy = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  categoryId: integer("category_id"),
  price: real("price").notNull(),
  deposit: real("deposit"),
  cost: real("cost"),
  sku: text("sku"),
  barcode: text("barcode"),
  imageUrl: text("image_url"),
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
});

let productColumnSupportCache: { stockType: boolean; durationDays: boolean } | null = null;

async function getProductColumnSupport(): Promise<{ stockType: boolean; durationDays: boolean }> {
  // Cache เฉพาะตอนที่ตรวจพบคอลัมน์แล้วเท่านั้น
  // เพื่อเลี่ยงเคส migrate เสร็จ แต่ dev server ยังถือค่า false ค้างอยู่
  if (productColumnSupportCache?.stockType && productColumnSupportCache.durationDays) return productColumnSupportCache;
  try {
    const client = db as unknown as {
      $client?: { execute?: (sql: string) => Promise<{ rows?: Array<Record<string, unknown>> }> };
    };
    const result = await client.$client?.execute?.('PRAGMA table_info("products")');
    const rows = (result?.rows ?? []) as Array<Record<string, unknown>>;
    const names = new Set(rows.map((r) => String(r.name ?? "")));
    productColumnSupportCache = {
      stockType: names.has("stock_type"),
      durationDays: names.has("duration_days"),
    };
    return productColumnSupportCache;
  } catch {
    return { stockType: false, durationDays: false };
  }
}

/** รายการแพ็กเกจทั้งหมด */
export async function findAllProducts(): Promise<ProductListItem[]> {
  const columnSupport = await getProductColumnSupport();
  if (!columnSupport.stockType || !columnSupport.durationDays) {
    const rows = await db
      .select({
        id: productsLegacy.id,
        name: productsLegacy.name,
        categoryId: productsLegacy.categoryId,
        categoryName: categories.name,
        price: productsLegacy.price,
        deposit: productsLegacy.deposit,
        cost: productsLegacy.cost,
        sku: productsLegacy.sku,
        barcode: productsLegacy.barcode,
        imageUrl: productsLegacy.imageUrl,
        description: productsLegacy.description,
        isActive: productsLegacy.isActive,
        createdAt: productsLegacy.createdAt,
      })
      .from(productsLegacy)
      .leftJoin(categories, eq(productsLegacy.categoryId, categories.id))
      .orderBy(desc(productsLegacy.createdAt));
    return rows.map((r) => ({
      ...r,
      categoryName: r.categoryName ?? null,
      deposit: r.deposit ?? null,
      description: r.description ?? null,
      durationDays: 30,
      stockType: "individual" as ProductStockType,
    }));
  }

  const rows = await db
    .select(productListSelect)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(desc(products.createdAt));
  return rows.map((r) => ({
    ...r,
    categoryName: r.categoryName ?? null,
    deposit: r.deposit ?? null,
    description: r.description ?? null,
  }));
}

/** Legacy: ไม่ใช้ stock จาก product แล้ว */
export async function findProductsLowStock(): Promise<ProductListItem[]> {
  return [];
}

export async function findProductById(id: number) {
  const columnSupport = await getProductColumnSupport();
  if (!columnSupport.stockType || !columnSupport.durationDays) {
    const [row] = await db
      .select({
        id: productsLegacy.id,
        name: productsLegacy.name,
        categoryId: productsLegacy.categoryId,
        price: productsLegacy.price,
        deposit: productsLegacy.deposit,
        cost: productsLegacy.cost,
        sku: productsLegacy.sku,
        barcode: productsLegacy.barcode,
        imageUrl: productsLegacy.imageUrl,
        description: productsLegacy.description,
        isActive: productsLegacy.isActive,
        createdAt: productsLegacy.createdAt,
      })
      .from(productsLegacy)
      .where(eq(productsLegacy.id, id))
      .limit(1);
    return row
      ? {
          ...row,
          durationDays: 30,
          stockType: "individual" as ProductStockType,
        }
      : null;
  }

  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return row ?? null;
}

export async function createProduct(data: {
  name: string;
  categoryId?: number | null;
  price: number;
  deposit?: number | null;
  cost?: number | null;
  sku?: string | null;
  barcode?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  durationDays?: number;
  stockType?: ProductStockType;
  isActive?: boolean;
}) {
  const columnSupport = await getProductColumnSupport();
  if (!columnSupport.stockType || !columnSupport.durationDays) {
    const [legacy] = await db
      .insert(productsLegacy)
      .values({
        name: data.name,
        categoryId: data.categoryId ?? null,
        price: data.price,
        deposit: data.deposit ?? null,
        cost: data.cost ?? null,
        sku: data.sku ?? null,
        barcode: data.barcode ?? null,
        imageUrl: data.imageUrl ?? null,
        description: data.description ?? null,
        isActive: data.isActive ?? true,
      })
      .returning();
    return legacy
      ? {
          ...legacy,
          durationDays: 30,
          stockType: "individual" as ProductStockType,
        }
      : null;
  }

  const [row] = await db
    .insert(products)
    .values({
      name: data.name,
      categoryId: data.categoryId ?? null,
      price: data.price,
      deposit: data.deposit ?? null,
      cost: data.cost ?? null,
      sku: data.sku ?? null,
      barcode: data.barcode ?? null,
      imageUrl: data.imageUrl ?? null,
      description: data.description ?? null,
      durationDays: data.durationDays ?? 30,
      stockType: data.stockType ?? "individual",
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
    deposit?: number | null;
    cost?: number | null;
    sku?: string | null;
    barcode?: string | null;
    imageUrl?: string | null;
    description?: string | null;
    durationDays?: number;
    stockType?: ProductStockType;
    isActive?: boolean;
  }
) {
  const columnSupport = await getProductColumnSupport();
  const payload: Record<string, unknown> = { ...data };
  if (!columnSupport.stockType) delete payload.stockType;
  if (!columnSupport.durationDays) delete payload.durationDays;
  if (Object.keys(payload).length === 0) return findProductById(id);
  if (!columnSupport.stockType || !columnSupport.durationDays) {
    const [legacy] = await db
      .update(productsLegacy)
      .set(payload as Partial<typeof productsLegacy.$inferInsert>)
      .where(eq(productsLegacy.id, id))
      .returning();
    return legacy
      ? {
          ...legacy,
          durationDays: 30,
          stockType: "individual" as ProductStockType,
        }
      : null;
  }
  const [row] = await db
    .update(products)
    .set(payload as Partial<typeof products.$inferInsert>)
    .where(eq(products.id, id))
    .returning();
  return row ?? null;
}

export async function deleteProductById(id: number): Promise<boolean> {
  const [row] = await db.delete(products).where(eq(products.id, id)).returning({ id: products.id });
  return row != null;
}

export async function setProductActive(id: number, isActive: boolean) {
  const columnSupport = await getProductColumnSupport();
  if (!columnSupport.stockType || !columnSupport.durationDays) {
    const [row] = await db
      .update(productsLegacy)
      .set({ isActive })
      .where(eq(productsLegacy.id, id))
      .returning({ id: productsLegacy.id, isActive: productsLegacy.isActive });
    return row ?? null;
  }
  const [row] = await db
    .update(products)
    .set({ isActive })
    .where(eq(products.id, id))
    .returning({ id: products.id, isActive: products.isActive });
  return row ?? null;
}
