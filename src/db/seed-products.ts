import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema/category.schema";
import { products } from "@/db/schema/product.schema";

/** สินค้าเช่าตัวอย่าง: [หมวด, [ชื่อ, ราคา/วัน, มัดจำ?, ต้นทุน?] ] */
const RENTAL_PRODUCTS: [string, [string, number, number?, number?][]][] = [
  [
    "กล้อง",
    [
      ["Canon EOS R5", 1500, 10000, 800],
      ["Sony A7 IV", 1200, 8000, 650],
      ["กล้องวิดีโอ Sony FX3", 2000, 15000, 1000],
      ["เลนส์ 24-70mm f/2.8", 500, 5000, 200],
      ["ขาตั้งกล้อง Manfrotto", 150, 1000, 50],
    ],
  ],
  [
    "รถ",
    [
      ["Toyota Camry", 2500, 20000, 1200],
      ["Honda City", 1500, 10000, 800],
      ["จักรยานยนต์ Honda PCX", 800, 5000, 300],
    ],
  ],
  [
    "อื่นๆ",
    [
      ["โปรเจคเตอร์ Epson", 400, 3000, 150],
      ["ไมค์ไร้สาย Shure", 200, 2000, 80],
      ["ไฟสตูดิโอ Godox", 300, 2500, 100],
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

async function seedProducts() {
  console.log("Seeding categories...");
  const categoryIds: Record<string, number> = {};
  for (const name of ["กล้อง", "รถ", "อื่นๆ"]) {
    categoryIds[name] = await getOrCreateCategoryId(name);
  }

  console.log("Seeding products...");
  let added = 0;
  for (const [catName, items] of RENTAL_PRODUCTS) {
    const categoryId = categoryIds[catName];
    for (const [productName, pricePerDay, deposit, cost] of items) {
      const [existing] = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.name, productName))
        .limit(1);
      if (existing) continue;

      await db.insert(products).values({
        name: productName,
        categoryId,
        price: pricePerDay,
        deposit: deposit ?? null,
        cost: cost ?? null,
        sku: null,
        barcode: null,
        imageUrl: null,
        description: null,
        isActive: true,
      });
      console.log("  +", productName, pricePerDay, "฿/วัน", deposit != null ? `(มัดจำ ${deposit} ฿)` : "");
      added++;
    }
  }

  console.log("Seed products done. Added", added, "products.");
}

seedProducts().catch((e) => {
  console.error("Seed products failed:", e);
  process.exit(1);
});
