import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema/category.schema";
import { products } from "@/db/schema/product.schema";
import type { ProductStockType } from "@/db/schema/product.schema";

/** แพ็กเกจพรีเมียมตัวอย่าง: [หมวด, [ชื่อแพ็กเกจ, ราคาขาย, ต้นทุน?] ] */
const PREMIUM_PRODUCTS: [string, [string, number, number?][]][] = [
  [
    "YouTube Premium",
    [
      ["YouTube Premium Individual 1 เดือน", 79, 49],
      ["YouTube Premium Individual 3 เดือน", 219, 149],
      ["YouTube Premium Family Slot 1 เดือน", 129, 89],
      ["YouTube Premium Invite Link 1 เดือน", 119, 79],
    ],
  ],
  [
    "Netflix Premium",
    [
      ["Netflix Premium 1 เดือน", 149, 109],
      ["Netflix Premium 3 เดือน", 399, 309],
      ["Netflix Shared Slot 1 เดือน", 99, 69],
    ],
  ],
  [
    "Disney+",
    [
      ["Disney+ Standard 1 เดือน", 69, 45],
      ["Disney+ Premium 1 ปี", 699, 499],
    ],
  ],
  [
    "Spotify Premium",
    [
      ["Spotify Premium Individual 1 เดือน", 79, 55],
      ["Spotify Premium Family Slot 1 เดือน", 109, 79],
    ],
  ],
  [
    "บัญชีลูกค้าส่งมาให้ร้าน",
    [
      ["อัปเกรด YouTube Premium จากบัญชีลูกค้า", 99, 0],
      ["อัปเกรด Netflix Premium จากบัญชีลูกค้า", 129, 0],
    ],
  ],
];

async function getOrCreateCategoryId(name: string): Promise<number> {
  const [existing] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.name, name))
    .limit(1);
  if (existing) return existing.id;
  const [row] = await db.insert(categories).values({ name }).returning({ id: categories.id });
  if (!row) throw new Error("Failed to create category: " + name);
  return row.id;
}

export async function seedProducts(): Promise<void> {
  console.log("Seeding categories...");
  const categoryIds: Record<string, number> = {};
  for (const name of PREMIUM_PRODUCTS.map(([catName]) => catName)) {
    categoryIds[name] = await getOrCreateCategoryId(name);
  }

  console.log("Seeding products...");
  let added = 0;
  for (const [catName, items] of PREMIUM_PRODUCTS) {
    const categoryId = categoryIds[catName];
    for (const [productName, price, cost] of items) {
      const [existing] = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.name, productName))
        .limit(1);
      if (existing) continue;

      const stockType = inferStockType(productName, catName);
      const durationDays = inferDurationDays(productName);
      await db.insert(products).values({
        name: productName,
        categoryId,
        price,
        deposit: null,
        cost: cost ?? null,
        sku: null,
        barcode: null,
        imageUrl: null,
        description: `แพ็กเกจในหมวด ${catName}`,
        durationDays,
        stockType,
        isActive: true,
      });
      console.log("  +", productName, price, "฿");
      added++;
    }
  }

  console.log("Seed products done. Added", added, "products.");
}

function inferStockType(productName: string, categoryName: string): ProductStockType {
  const text = `${productName} ${categoryName}`.toLowerCase();
  if (text.includes("customer") || text.includes("ลูกค้า")) return "customer_account";
  if (text.includes("family") || text.includes("slot") || text.includes("shared")) return "family";
  if (text.includes("invite")) return "invite";
  return "individual";
}

function inferDurationDays(productName: string): number {
  const text = productName.toLowerCase();
  if (text.includes("1 ปี") || text.includes("12 เดือน")) return 365;
  if (text.includes("3 เดือน")) return 90;
  return 30;
}

const isMain = process.argv[1]?.replace(/\\/g, "/").endsWith("seed-products.ts");
if (isMain) {
  seedProducts().catch((e) => {
    console.error("Seed products failed:", e);
    process.exit(1);
  });
}
