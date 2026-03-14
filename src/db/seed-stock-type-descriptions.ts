import "dotenv/config";
import { db } from "@/db";
import { settings } from "@/db/schema/settings.schema";
import { PRODUCT_STOCK_TYPES, type ProductStockType } from "@/db/schema/product.schema";

const PREFIX = "stock_type_";
const SUFFIX_NAME = "_name";
const SUFFIX_DESCRIPTION = "_description";
const SUFFIX_IMAGE = "_image";

function keyName(slug: ProductStockType) {
  return `${PREFIX}${slug}${SUFFIX_NAME}`;
}
function keyDescription(slug: ProductStockType) {
  return `${PREFIX}${slug}${SUFFIX_DESCRIPTION}`;
}
function keyImage(slug: ProductStockType) {
  return `${PREFIX}${slug}${SUFFIX_IMAGE}`;
}

const DEFAULT_NAMES: Record<ProductStockType, string> = {
  individual: "Individual (รายบุคคล)",
  family: "Family (ครอบครัว)",
  invite: "Invite (ลิงก์เชิญ)",
  customer_account: "Customer Account (บัญชีลูกค้า)",
};

const DEFAULT_DESCRIPTIONS: Record<ProductStockType, string> = {
  individual: "<p>ใช้สำหรับสินค้าที่ผูกกับบัญชีเดียว (หนึ่งรหัสต่อหนึ่งผู้ใช้)</p>",
  family: "<p>ใช้สำหรับแพ็กเกจแบบครอบครัว มีหัวกลุ่มจัดการและสมาชิกในกลุ่ม</p>",
  invite: "<p>สร้างลิงก์เชิญให้ลูกค้านำไปใช้งานหรือแจกจ่ายได้</p>",
  customer_account: "<p>ผูกกับบัญชีลูกค้าในระบบ (เช่น ล็อกอิน LINE) ใช้สำหรับการเช่าต่อเนื่อง</p>",
};

export async function seedStockTypeDescriptions(): Promise<void> {
  console.log("Seeding stock type descriptions...");
  for (const slug of PRODUCT_STOCK_TYPES) {
    const name = DEFAULT_NAMES[slug];
    const description = DEFAULT_DESCRIPTIONS[slug];
    const imageKey = "";
    const entries: [string, string][] = [
      [keyName(slug), name],
      [keyDescription(slug), description],
      [keyImage(slug), imageKey],
    ];
    for (const [key, value] of entries) {
      await db
        .insert(settings)
        .values({ key, value: value ?? "" })
        .onConflictDoUpdate({ target: settings.key, set: { value: value ?? "" } });
    }
  }
  console.log("Seed stock type descriptions done.");
}

const isMain = process.argv[1]?.replace(/\\/g, "/").endsWith("seed-stock-type-descriptions.ts");
if (isMain) {
  seedStockTypeDescriptions().catch((e) => {
    console.error("Seed stock type descriptions failed:", e);
    process.exit(1);
  });
}
