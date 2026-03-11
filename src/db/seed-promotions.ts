import "dotenv/config";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema/product.schema";
import { findPromotions, upsertPromotion } from "@/features/promotion/promotion.repo";

/** โปรโมชันเริ่มต้น: ชื่อ, ส่วนลด %, ชื่อสินค้าที่ร่วมโปร (ต้องมีใน products แล้ว) */
const DEFAULT_PROMOTIONS: {
  name: string;
  discountPercent: number;
  startAt: Date;
  endAt: Date;
  productNames: string[];
}[] = [
  {
    name: "ลดเปิดร้าน",
    discountPercent: 10,
    startAt: new Date(),
    endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    productNames: ["Canon EOS R5", "Sony A7 IV", "Toyota Camry", "Honda City"],
  },
  {
    name: "โปรกล้อง",
    discountPercent: 15,
    startAt: new Date(),
    endAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    productNames: ["Canon EOS R5", "Sony A7 IV", "กล้องวิดีโอ Sony FX3", "เลนส์ 24-70mm f/2.8"],
  },
];

async function getProductIdsByNames(names: string[]): Promise<number[]> {
  if (names.length === 0) return [];
  const rows = await db
    .select({ id: products.id })
    .from(products)
    .where(inArray(products.name, names));
  return rows.map((r) => r.id);
}

async function seedPromotions() {
  const existing = await findPromotions(false);
  const byName = new Map(existing.map((p) => [p.name, p]));

  for (const promo of DEFAULT_PROMOTIONS) {
    const productIds = await getProductIdsByNames(promo.productNames);
    const existingPromo = byName.get(promo.name);
    await upsertPromotion({
      id: existingPromo?.id,
      name: promo.name,
      discountPercent: promo.discountPercent,
      startAt: promo.startAt,
      endAt: promo.endAt,
      productIds,
    });
    console.log(
      existingPromo ? "Updated promo:" : "Added promo:",
      promo.name,
      `${promo.discountPercent}%`,
      `(${productIds.length} สินค้า)`
    );
  }
  console.log("Seed promotions done.");
}

seedPromotions().catch((e) => {
  console.error("Seed promotions failed:", e);
  process.exit(1);
});
