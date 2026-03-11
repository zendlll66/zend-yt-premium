import { and, eq, gte, inArray, lte, asc } from "drizzle-orm";
import { db } from "@/db";
import { promotions, promotionProducts } from "@/db/schema/promotion.schema";
import { getMenuForOrder, type MenuProduct } from "@/features/modifier/modifier.repo";

export type PromotionRow = typeof promotions.$inferSelect;
export type PromotionWithProductIds = PromotionRow & { productIds: number[] };

const now = () => new Date();

/** โปรโมชันที่กำลัง active (อยู่ในช่วงเวลา) */
export function isPromotionActive(p: PromotionRow): boolean {
  const t = now().getTime();
  return t >= (p.startAt as Date).getTime() && t <= (p.endAt as Date).getTime();
}

export async function findPromotions(activeOnly = false): Promise<PromotionWithProductIds[]> {
  const list = await db.select().from(promotions).orderBy(asc(promotions.startAt));
  const filtered = activeOnly ? list.filter(isPromotionActive) : list;
  if (filtered.length === 0) return [];

  const ids = filtered.map((p) => p.id);
  const links = await db
    .select({ promotionId: promotionProducts.promotionId, productId: promotionProducts.productId })
    .from(promotionProducts)
    .where(inArray(promotionProducts.promotionId, ids));

  const productIdsByPromo = links.reduce(
    (acc, l) => {
      if (!acc[l.promotionId]) acc[l.promotionId] = [];
      acc[l.promotionId].push(l.productId);
      return acc;
    },
    {} as Record<number, number[]>
  );

  return filtered.map((p) => ({
    ...p,
    productIds: productIdsByPromo[p.id] ?? [],
  }));
}

export async function findPromotionById(id: number): Promise<PromotionWithProductIds | null> {
  const [row] = await db.select().from(promotions).where(eq(promotions.id, id)).limit(1);
  if (!row) return null;
  const links = await db
    .select({ productId: promotionProducts.productId })
    .from(promotionProducts)
    .where(eq(promotionProducts.promotionId, id));
  return { ...row, productIds: links.map((l) => l.productId) };
}

export async function upsertPromotion(data: {
  id?: number;
  name: string;
  discountPercent: number;
  startAt: Date;
  endAt: Date;
  productIds: number[];
}): Promise<number> {
  const payload = {
    name: data.name.trim(),
    discountPercent: data.discountPercent,
    startAt: data.startAt,
    endAt: data.endAt,
  };
  if (data.id != null) {
    await db.update(promotions).set(payload).where(eq(promotions.id, data.id));
    await db.delete(promotionProducts).where(eq(promotionProducts.promotionId, data.id));
    const id = data.id;
    if (data.productIds.length > 0) {
      await db.insert(promotionProducts).values(
        data.productIds.map((productId) => ({ promotionId: id, productId }))
      );
    }
    return id;
  }
  const [inserted] = await db.insert(promotions).values(payload).returning({ id: promotions.id });
  const id = inserted!.id;
  if (data.productIds.length > 0) {
    await db.insert(promotionProducts).values(
      data.productIds.map((productId) => ({ promotionId: id, productId }))
    );
  }
  return id;
}

export async function deletePromotion(id: number): Promise<boolean> {
  const [row] = await db.delete(promotions).where(eq(promotions.id, id)).returning({ id: promotions.id });
  return !!row;
}

/** Map productId → ส่วนลด % จากโปรที่กำลัง active (สำหรับส่งไปที่ client แสดงราคา/คำนวณตะกร้า) */
export async function getActivePromotionDiscountMap(): Promise<Record<number, number>> {
  const nowDate = now();
  const rows = await db
    .select({
      productId: promotionProducts.productId,
      discountPercent: promotions.discountPercent,
    })
    .from(promotionProducts)
    .innerJoin(promotions, eq(promotionProducts.promotionId, promotions.id))
    .where(and(lte(promotions.startAt, nowDate), gte(promotions.endAt, nowDate)));
  const map: Record<number, number> = {};
  for (const r of rows) {
    const current = map[r.productId] ?? 0;
    if (r.discountPercent > current) map[r.productId] = r.discountPercent;
  }
  return map;
}

/** ส่วนลด % สูงสุดที่ใช้กับสินค้านี้ (จากโปรที่กำลัง active) — ไม่มีคืน null */
export async function getActiveDiscountByProductId(productId: number): Promise<number | null> {
  const nowDate = now();
  const rows = await db
    .select({
      discountPercent: promotions.discountPercent,
    })
    .from(promotionProducts)
    .innerJoin(promotions, eq(promotionProducts.promotionId, promotions.id))
    .where(
      and(
        eq(promotionProducts.productId, productId),
        lte(promotions.startAt, nowDate),
        gte(promotions.endAt, nowDate)
      )
    );
  if (rows.length === 0) return null;
  const maxDiscount = Math.max(...rows.map((r) => r.discountPercent));
  return maxDiscount > 0 ? maxDiscount : null;
}

/** สินค้าในเมนูที่กำลังลดราคา (มีโปร active) พร้อม % ลด */
export type MenuProductWithDiscount = MenuProduct & { discountPercent: number };

export async function getProductsOnSale(): Promise<MenuProductWithDiscount[]> {
  const nowDate = now();
  const activePromoRows = await db
    .select({
      productId: promotionProducts.productId,
      discountPercent: promotions.discountPercent,
    })
    .from(promotionProducts)
    .innerJoin(promotions, eq(promotionProducts.promotionId, promotions.id))
    .where(and(lte(promotions.startAt, nowDate), gte(promotions.endAt, nowDate)));
  const discountByProduct = activePromoRows.reduce(
    (acc, r) => {
      const current = acc.get(r.productId) ?? 0;
      if (r.discountPercent > current) acc.set(r.productId, r.discountPercent);
      return acc;
    },
    new Map<number, number>()
  );
  const menu = await getMenuForOrder();
  return menu
    .filter((p) => (discountByProduct.get(p.id) ?? 0) > 0)
    .map((p) => ({ ...p, discountPercent: discountByProduct.get(p.id)! }));
}
