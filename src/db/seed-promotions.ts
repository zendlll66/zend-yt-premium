import "dotenv/config";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema/product.schema";
import { findPromotions, upsertPromotion } from "@/features/promotion/promotion.repo";

/** โปรโมชันเริ่มต้น: ชื่อ, ส่วนลด %, ชื่อสินค้าที่ร่วมโปร (ต้องมีใน products แล้ว — ใช้ชื่อจาก seed-products) */
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
    productNames: [
      "YouTube Premium Individual 1 เดือน",
      "YouTube Premium Individual 3 เดือน",
      "Netflix Premium 1 เดือน",
      "Disney+ Standard 1 เดือน",
    ],
  },
  {
    name: "โปร YouTube Premium",
    discountPercent: 15,
    startAt: new Date(),
    endAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    productNames: [
      "YouTube Premium Individual 1 เดือน",
      "YouTube Premium Individual 3 เดือน",
      "YouTube Premium Family Slot 1 เดือน",
      "YouTube Premium Invite Link 1 เดือน",
    ],
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

export async function seedPromotions(): Promise<void> {
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

const isMain = process.argv[1]?.replace(/\\/g, "/").endsWith("seed-promotions.ts");
if (isMain) {
  seedPromotions().catch((e) => {
    console.error("Seed promotions failed:", e);
    process.exit(1);
  });
}
