import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema/category.schema";
import { products } from "@/db/schema/product.schema";

/** หมวดหมู่ร้านชาบู */
const SHABU_CATEGORIES = [
  "เนื้อวัว",
  "เนื้อหมู",
  "ซีฟู๊ด",
  "ผักและของใส่ชาบู",
  "เครื่องดื่ม",
  "ซอสและของเสริม",
];

/** สินค้าตามหมวดหมู่: [ชื่อหมวด, [ [ชื่อสินค้า, ราคา, ต้นทุน?] ] ] */
const SHABU_PRODUCTS: [string, [string, number, number?][]][] = [
  [
    "เนื้อวัว",
    [
      ["สันในวัว", 299, 180],
      ["สันนอกวัว", 279, 160],
      ["ซี่โครงวัว", 259, 150],
      ["เนื้อสไลด์พรีเมียม", 349, 200],
    ],
  ],
  [
    "เนื้อหมู",
    [
      ["สันในหมู", 159, 90],
      ["สามชั้นหมู", 139, 75],
      ["หมูสไลด์", 179, 95],
    ],
  ],
  [
    "ซีฟู๊ด",
    [
      ["กุ้งสด", 189, 120],
      ["ปลาหมึก", 169, 100],
      ["หอยแมลงภู่", 129, 70],
      ["ลูกชิ้นปลา", 79, 40],
    ],
  ],
  [
    "ผักและของใส่ชาบู",
    [
      ["ผักกาดขาว", 49, 20],
      ["เห็ดเข็มทอง", 59, 30],
      ["เห็ดนางรม", 59, 28],
      ["บะหมี่ไข่", 29, 12],
      ["วุ้นเส้น", 29, 10],
      ["เต้าหู้", 39, 18],
      ["เซ็ตผักรวม", 89, 45],
    ],
  ],
  [
    "เครื่องดื่ม",
    [
      ["น้ำอัดลม", 25, 8],
      ["ชาเย็น", 35, 12],
      ["น้ำเปล่า", 15, 3],
      ["น้ำส้ม", 45, 18],
      ["โซดา", 30, 10],
    ],
  ],
  [
    "ซอสและของเสริม",
    [
      ["ซอสชาบู", 15, 5],
      ["ไข่ไก่ (สำหรับทานกับเนื้อ)", 10, 4],
      ["ข้าวสวย", 15, 5],
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
  for (const name of SHABU_CATEGORIES) {
    categoryIds[name] = await getOrCreateCategoryId(name);
    console.log("  Category:", name, "-> id", categoryIds[name]);
  }

  console.log("Seeding products...");
  let added = 0;
  for (const [catName, items] of SHABU_PRODUCTS) {
    const categoryId = categoryIds[catName];
    for (const [productName, price, cost] of items) {
      const [existing] = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.name, productName))
        .limit(1);
      if (existing) continue;

      await db.insert(products).values({
        name: productName,
        categoryId,
        price,
        cost: cost ?? null,
        sku: null,
        barcode: null,
        imageUrl: null,
        isActive: true,
      });
      console.log("  +", productName, price, "฿");
      added++;
    }
  }

  console.log("Seed products done. Added", added, "products.");
}

seedProducts().catch((e) => {
  console.error("Seed products failed:", e);
  process.exit(1);
});
