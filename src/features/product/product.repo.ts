import { and, desc, eq } from "drizzle-orm";
import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { db } from "@/db";
import { products, PRODUCT_STOCK_TYPES } from "@/db/schema/product.schema";
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
  durationMonths: number;
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
  durationMonths: products.durationMonths,
  stockType: products.stockType,
  isActive: products.isActive,
  createdAt: products.createdAt,
};

/** สคีมาเก่า: ยังไม่มี stock_type / duration */
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

/**
 * สคีมากลาง: มี stock_type + duration_days แต่ยังไม่มี duration_months (ยังไม่รัน migrate ล่าสุด)
 * แปลงกับจำนวนเดือนแบบเดียวกับ backfill: เดือน ≈ วัน/30
 */
const productsHybrid = sqliteTable("products", {
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
  durationDays: integer("duration_days").notNull().default(30),
  stockType: text("stock_type", { enum: PRODUCT_STOCK_TYPES }).notNull().default("individual"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export type ProductColumnSupport = {
  stockType: boolean;
  durationMonthsColumn: boolean;
  durationDaysColumn: boolean;
  useModernProducts: boolean;
  useHybridDurationDays: boolean;
};

let productColumnSupportCache: ProductColumnSupport | null = null;

function monthsToDurationDaysApprox(months: number): number {
  return Math.max(1, Math.round(Math.max(1, months) * 30));
}

function durationDaysToMonthsApprox(days: number): number {
  return Math.max(1, Math.round(Math.max(1, days) / 30));
}

async function getProductColumnSupport(): Promise<ProductColumnSupport> {
  if (productColumnSupportCache) return productColumnSupportCache;
  try {
    const client = (
      db as unknown as {
        $client?: { execute?: (sql: string) => Promise<{ rows?: Array<Record<string, unknown>> }> };
      }
    ).$client;
    const result = await client?.execute?.('PRAGMA table_info("products")');
    const rows = (result?.rows ?? []) as Array<Record<string, unknown>>;
    const names = new Set(rows.map((r) => String(r.name ?? "")));
    const stockType = names.has("stock_type");
    const durationMonthsColumn = names.has("duration_months");
    const durationDaysColumn = names.has("duration_days");
    productColumnSupportCache = {
      stockType,
      durationMonthsColumn,
      durationDaysColumn,
      useModernProducts: stockType && durationMonthsColumn,
      useHybridDurationDays: stockType && durationDaysColumn && !durationMonthsColumn,
    };
    return productColumnSupportCache;
  } catch {
    productColumnSupportCache = {
      stockType: false,
      durationMonthsColumn: false,
      durationDaysColumn: false,
      useModernProducts: false,
      useHybridDurationDays: false,
    };
    return productColumnSupportCache;
  }
}

/** อ่านจำนวนเดือนจากสินค้า — รองรับทั้ง duration_months และ duration_days (legacy) */
export async function getProductDurationMonthsByProductId(
  conn: typeof db,
  productId: number
): Promise<number> {
  const s = await getProductColumnSupport();
  try {
    if (s.useModernProducts) {
      const [row] = await conn
        .select({ durationMonths: products.durationMonths })
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);
      const m = row?.durationMonths ?? 1;
      return m >= 1 ? m : 1;
    }
    if (s.useHybridDurationDays) {
      const [row] = await conn
        .select({ durationDays: productsHybrid.durationDays })
        .from(productsHybrid)
        .where(eq(productsHybrid.id, productId))
        .limit(1);
      return durationDaysToMonthsApprox(row?.durationDays ?? 30);
    }
  } catch {
    /* fall through */
  }
  return 1;
}

/** รายการแพ็กเกจทั้งหมด */
export async function findAllProducts(): Promise<ProductListItem[]> {
  const s = await getProductColumnSupport();
  if (s.useModernProducts) {
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

  if (s.useHybridDurationDays) {
    const rows = await db
      .select({
        id: productsHybrid.id,
        name: productsHybrid.name,
        categoryId: productsHybrid.categoryId,
        categoryName: categories.name,
        price: productsHybrid.price,
        deposit: productsHybrid.deposit,
        cost: productsHybrid.cost,
        sku: productsHybrid.sku,
        barcode: productsHybrid.barcode,
        imageUrl: productsHybrid.imageUrl,
        description: productsHybrid.description,
        durationDays: productsHybrid.durationDays,
        stockType: productsHybrid.stockType,
        isActive: productsHybrid.isActive,
        createdAt: productsHybrid.createdAt,
      })
      .from(productsHybrid)
      .leftJoin(categories, eq(productsHybrid.categoryId, categories.id))
      .orderBy(desc(productsHybrid.createdAt));
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      categoryId: r.categoryId,
      categoryName: r.categoryName ?? null,
      price: r.price,
      deposit: r.deposit ?? null,
      cost: r.cost ?? null,
      sku: r.sku,
      barcode: r.barcode,
      imageUrl: r.imageUrl,
      description: r.description ?? null,
      durationMonths: durationDaysToMonthsApprox(r.durationDays ?? 30),
      stockType: r.stockType as ProductStockType,
      isActive: r.isActive,
      createdAt: r.createdAt,
    }));
  }

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
    durationMonths: 1,
    stockType: "individual" as ProductStockType,
  }));
}

/** Legacy: ไม่ใช้ stock จาก product แล้ว */
export async function findProductsLowStock(): Promise<ProductListItem[]> {
  return [];
}

export async function findProductById(id: number) {
  const s = await getProductColumnSupport();
  if (s.useModernProducts) {
    const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return row ?? null;
  }
  if (s.useHybridDurationDays) {
    const [row] = await db.select().from(productsHybrid).where(eq(productsHybrid.id, id)).limit(1);
    if (!row) return null;
    return {
      ...row,
      durationMonths: durationDaysToMonthsApprox(row.durationDays ?? 30),
      stockType: row.stockType as ProductStockType,
    };
  }

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
        durationMonths: 1,
        stockType: "individual" as ProductStockType,
      }
    : null;
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
  durationMonths?: number;
  stockType?: ProductStockType;
  isActive?: boolean;
}) {
  const s = await getProductColumnSupport();
  if (s.useModernProducts) {
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
        durationMonths: data.durationMonths ?? 1,
        stockType: data.stockType ?? "individual",
        isActive: data.isActive ?? true,
      })
      .returning();
    return row ?? null;
  }
  if (s.useHybridDurationDays) {
    const [row] = await db
      .insert(productsHybrid)
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
        durationDays: monthsToDurationDaysApprox(data.durationMonths ?? 1),
        stockType: data.stockType ?? "individual",
        isActive: data.isActive ?? true,
      })
      .returning();
    return row
      ? {
          ...row,
          durationMonths: durationDaysToMonthsApprox(row.durationDays ?? 30),
          stockType: row.stockType as ProductStockType,
        }
      : null;
  }

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
        durationMonths: 1,
        stockType: "individual" as ProductStockType,
      }
    : null;
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
    durationMonths?: number;
    stockType?: ProductStockType;
    isActive?: boolean;
  }
) {
  const s = await getProductColumnSupport();
  if (s.useModernProducts) {
    const payload: Record<string, unknown> = { ...data };
    if (!s.stockType) delete payload.stockType;
    if (Object.keys(payload).length === 0) return findProductById(id);
    const [row] = await db
      .update(products)
      .set(payload as Partial<typeof products.$inferInsert>)
      .where(eq(products.id, id))
      .returning();
    return row ?? null;
  }
  if (s.useHybridDurationDays) {
    const set: Record<string, unknown> = { ...data };
    delete set.durationMonths;
    if (data.durationMonths !== undefined) {
      set.durationDays = monthsToDurationDaysApprox(data.durationMonths);
    }
    if (!s.stockType) delete set.stockType;
    if (Object.keys(set).length === 0) return findProductById(id);
    const [row] = await db
      .update(productsHybrid)
      .set(set as Partial<typeof productsHybrid.$inferInsert>)
      .where(eq(productsHybrid.id, id))
      .returning();
    return row
      ? {
          ...row,
          durationMonths: durationDaysToMonthsApprox(row.durationDays ?? 30),
          stockType: row.stockType as ProductStockType,
        }
      : null;
  }

  const payload: Record<string, unknown> = { ...data };
  delete payload.durationMonths;
  delete payload.stockType;
  if (Object.keys(payload).length === 0) return findProductById(id);
  const [legacy] = await db
    .update(productsLegacy)
    .set(payload as Partial<typeof productsLegacy.$inferInsert>)
    .where(eq(productsLegacy.id, id))
    .returning();
  return legacy
    ? {
        ...legacy,
        durationMonths: 1,
        stockType: "individual" as ProductStockType,
      }
    : null;
}

export async function deleteProductById(id: number): Promise<boolean> {
  const s = await getProductColumnSupport();
  if (s.useModernProducts) {
    const [row] = await db.delete(products).where(eq(products.id, id)).returning({ id: products.id });
    return row != null;
  }
  if (s.useHybridDurationDays) {
    const [row] = await db
      .delete(productsHybrid)
      .where(eq(productsHybrid.id, id))
      .returning({ id: productsHybrid.id });
    return row != null;
  }
  const [row] = await db
    .delete(productsLegacy)
    .where(eq(productsLegacy.id, id))
    .returning({ id: productsLegacy.id });
  return row != null;
}

export async function setProductActive(id: number, isActive: boolean) {
  const s = await getProductColumnSupport();
  if (s.useModernProducts) {
    const [row] = await db
      .update(products)
      .set({ isActive })
      .where(eq(products.id, id))
      .returning({ id: products.id, isActive: products.isActive });
    return row ?? null;
  }
  if (s.useHybridDurationDays) {
    const [row] = await db
      .update(productsHybrid)
      .set({ isActive })
      .where(eq(productsHybrid.id, id))
      .returning({ id: productsHybrid.id, isActive: productsHybrid.isActive });
    return row ?? null;
  }
  const [row] = await db
    .update(productsLegacy)
    .set({ isActive })
    .where(eq(productsLegacy.id, id))
    .returning({ id: productsLegacy.id, isActive: productsLegacy.isActive });
  return row ?? null;
}

/** ต่ออายุ: จับคู่สินค้าตาม stock + จำนวนเดือน (หรือ fallback ตาม stock อย่างเดียว) */
export async function selectRenewalProduct(
  itemType: ProductStockType,
  durationMonths: number
): Promise<{ id: number; name: string; price: number } | null> {
  const s = await getProductColumnSupport();
  const months = Math.max(1, Math.floor(durationMonths));

  if (s.useModernProducts) {
    let [row] = await db
      .select({ id: products.id, name: products.name, price: products.price })
      .from(products)
      .where(and(eq(products.stockType, itemType), eq(products.durationMonths, months)))
      .limit(1);
    if (!row) {
      [row] = await db
        .select({ id: products.id, name: products.name, price: products.price })
        .from(products)
        .where(eq(products.stockType, itemType))
        .limit(1);
    }
    return row ?? null;
  }

  if (s.useHybridDurationDays) {
    const days = monthsToDurationDaysApprox(months);
    let [row] = await db
      .select({ id: productsHybrid.id, name: productsHybrid.name, price: productsHybrid.price })
      .from(productsHybrid)
      .where(and(eq(productsHybrid.stockType, itemType), eq(productsHybrid.durationDays, days)))
      .limit(1);
    if (!row) {
      [row] = await db
        .select({ id: productsHybrid.id, name: productsHybrid.name, price: productsHybrid.price })
        .from(productsHybrid)
        .where(eq(productsHybrid.stockType, itemType))
        .limit(1);
    }
    return row ?? null;
  }

  return null;
}
