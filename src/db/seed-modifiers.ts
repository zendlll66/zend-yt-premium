import "dotenv/config";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { modifierGroups } from "@/db/schema/modifier.schema";
import { modifiers } from "@/db/schema/modifier.schema";

/** [ชื่อกลุ่ม, บังคับเลือก, [[ชื่อตัวเลือก, ราคาเพิ่ม], ...] ] - ใช้กับของเช่าได้ (ประกัน, เพิ่มวัน) */
const SEED_MODIFIERS: [string, boolean, [string, number][]][] = [
  ["ประกัน", false, [["ไม่รับ", 0], ["รับประกัน (ค่ามัดจำลด 50%)", 0]]],
  ["เพิ่มวัน", false, [["ไม่เพิ่ม", 0], ["+1 วัน", 0], ["+3 วัน", 0]]],
  ["Size", false, [["Standard", 0], ["Large", 100]]],
];

async function getOrCreateGroupId(name: string, required: boolean): Promise<number> {
  const [existing] = await db
    .select({ id: modifierGroups.id })
    .from(modifierGroups)
    .where(eq(modifierGroups.name, name))
    .limit(1);
  if (existing) return existing.id;
  const [row] = await db
    .insert(modifierGroups)
    .values({ name, required })
    .returning({ id: modifierGroups.id });
  if (!row) throw new Error("Failed to create group: " + name);
  console.log("  Group:", name, required ? "(บังคับเลือก)" : "");
  return row.id;
}

async function modifierExists(groupId: number, name: string): Promise<boolean> {
  const [row] = await db
    .select({ id: modifiers.id })
    .from(modifiers)
    .where(and(eq(modifiers.groupId, groupId), eq(modifiers.name, name)))
    .limit(1);
  return !!row;
}

async function seedModifiers() {
  console.log("Seeding modifier groups and options...");

  for (const [groupName, required, options] of SEED_MODIFIERS) {
    const groupId = await getOrCreateGroupId(groupName, required);

    for (const [optName, price] of options) {
      const exists = await modifierExists(groupId, optName);
      if (exists) continue;
      await db.insert(modifiers).values({ groupId, name: optName, price });
      console.log("    +", optName, price > 0 ? `+${price}฿` : "");
    }
  }

  console.log("Seed modifiers done.");
}

seedModifiers().catch((e) => {
  console.error("Seed modifiers failed:", e);
  process.exit(1);
});
