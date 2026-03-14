import "dotenv/config";
import { eq } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { db } from "@/db";
import { categories } from "@/db/schema/category.schema";

type SeedCategory = {
  name: string;
  detail?: string | null;
  imageUrl?: string | null;
};

/** หมวดหมู่สำหรับระบบขายบัญชี/แพลนพรีเมียม */
const PREMIUM_CATEGORIES: SeedCategory[] = [
  {
    name: "YouTube Premium",
    detail: "แพ็กเกจ YouTube Premium ทั้งแบบ Individual, Family และ Invite Link",
    imageUrl: null,
  },
  {
    name: "Netflix Premium",
    detail: "แพ็กเกจ Netflix สำหรับลูกค้ารายบุคคลหรือแชร์ภายในบ้าน",
    imageUrl: null,
  },
  {
    name: "Disney+",
    detail: "บริการสตรีมมิง Disney+ และแพ็กเกจที่เกี่ยวข้อง",
    imageUrl: null,
  },
  {
    name: "Spotify Premium",
    detail: "แพ็กเกจ Spotify Premium สำหรับบุคคลและครอบครัว",
    imageUrl: null,
  },
  {
    name: "บัญชีลูกค้าส่งมาให้ร้าน",
    detail: "ลูกค้าส่งอีเมล/รหัสผ่านมาให้ร้านดำเนินการสมัคร Premium",
    imageUrl: null,
  },
];

type CategoryColumnSupport = {
  imageUrl: boolean;
  detail: boolean;
};

const categoriesLegacy = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

async function getCategoryColumnSupport(): Promise<CategoryColumnSupport> {
  try {
    const client = (db as unknown as { $client?: { execute?: (query: string) => Promise<{ rows?: Array<Record<string, unknown>> }> } }).$client;
    if (!client?.execute) throw new Error("DB_CLIENT_EXECUTE_NOT_AVAILABLE");
    const result = await client.execute('PRAGMA table_info("categories")');
    const rows = (result.rows ?? []) as Array<Record<string, unknown>>;
    const names = new Set(rows.map((r) => String(r.name ?? "")));
    return {
      imageUrl: names.has("image_url"),
      detail: names.has("detail"),
    };
  } catch {
    return { imageUrl: false, detail: false };
  }
}

export async function seedCategories(): Promise<void> {
  const columnSupport = await getCategoryColumnSupport();

  for (const item of PREMIUM_CATEGORIES) {
    const [existing] =
      columnSupport.imageUrl && columnSupport.detail
        ? await db
            .select()
            .from(categories)
            .where(eq(categories.name, item.name))
            .limit(1)
        : await db
            .select({
              id: categories.id,
              name: categories.name,
              createdAt: categories.createdAt,
            })
            .from(categories)
            .where(eq(categories.name, item.name))
            .limit(1);

    if (!existing) {
      if (columnSupport.imageUrl && columnSupport.detail) {
        await db.insert(categories).values({
          name: item.name,
          imageUrl: item.imageUrl ?? null,
          detail: item.detail ?? null,
        });
      } else {
        await db.insert(categoriesLegacy).values({
          name: item.name,
          createdAt: new Date(),
        });
      }
      console.log("  + หมวดหมู่:", item.name);
      continue;
    }

    // อัปเดตข้อมูลที่ยังว่างอยู่ให้ครบ (idempotent)
    const updatePayload: Record<string, unknown> = {};
    const existingDetail = "detail" in existing ? (existing.detail as string | null) : null;
    const existingImageUrl = "imageUrl" in existing ? (existing.imageUrl as string | null) : null;

    if (columnSupport.detail && !existingDetail && item.detail) {
      updatePayload.detail = item.detail;
    }
    if (columnSupport.imageUrl && !existingImageUrl && item.imageUrl) {
      updatePayload.imageUrl = item.imageUrl;
    }

    if (Object.keys(updatePayload).length > 0) {
      await db.update(categories).set(updatePayload).where(eq(categories.id, existing.id));
      console.log("  ~ อัปเดตหมวดหมู่:", item.name);
    }
  }

  console.log("Seed categories done.");
}

const isMain = process.argv[1]?.replace(/\\/g, "/").endsWith("seed-categories.ts");
if (isMain) {
  seedCategories().catch((e) => {
    console.error("Seed categories failed:", e);
    process.exit(1);
  });
}
