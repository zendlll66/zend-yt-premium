import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tables } from "@/db/schema/table.schema";

const DEFAULT_TABLES = ["1", "2", "3", "4", "5", "6", "7", "8"];

async function seedTables() {
  for (const num of DEFAULT_TABLES) {
    const [existing] = await db
      .select()
      .from(tables)
      .where(eq(tables.tableNumber, num))
      .limit(1);
    if (existing) continue;
    await db.insert(tables).values({ tableNumber: num, capacity: 4 });
    console.log("  + โต๊ะ", num);
  }
  console.log("Seed tables done.");
}

seedTables().catch((e) => {
  console.error("Seed tables failed:", e);
  process.exit(1);
});
