import "dotenv/config";
import { seed } from "./seed";
import { seedRoles } from "./seed-roles";
import { seedPages } from "./seed-pages";
import { seedCategories } from "./seed-categories";
import { seedProducts } from "./seed-products";
import { seedModifiers } from "./seed-modifiers";
import { seedMembership } from "./seed-membership";
import { seedPromotions } from "./seed-promotions";
import { seedStocks } from "./seed-stocks";
import { seedOrders } from "./seed-orders";
import { seedSettings } from "./seed-settings";
import { seedStockTypeDescriptions } from "./seed-stock-type-descriptions";

/** รัน seed ทั้งหมดตามลำดับที่ถูกต้อง (admin → roles → pages → … → settings → stock-type-descriptions) */
async function seedAll(): Promise<void> {
  console.log("=== Seed All ===\n");

  await seed();
  await seedRoles();
  await seedPages();
  await seedCategories();
  await seedProducts();
  await seedModifiers();
  await seedMembership();
  await seedPromotions();
  await seedStocks();
  await seedOrders();
  await seedSettings();
  await seedStockTypeDescriptions();

  console.log("\n=== Seed All Done ===");
}

seedAll().catch((e) => {
  console.error("Seed all failed:", e);
  process.exit(1);
});
