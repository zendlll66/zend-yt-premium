import "dotenv/config";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { modifierGroups } from "@/db/schema/modifier.schema";
import { modifiers } from "@/db/schema/modifier.schema";

/** [ชื่อกลุ่ม, บังคับเลือก, [[ชื่อตัวเลือก, ราคาเพิ่ม], ...] ] */
const SEED_MODIFIERS: [string, boolean, [string, number][]][] = [
  ["Size", true, [["Small", 0], ["Medium", 10], ["Large", 20]]],
  ["Extra shot", false, [["ไม่เพิ่ม", 0], ["เพิ่ม 1 shot", 20]]],
  ["นม", false, [["นมธรรมดา", 0], ["Oat milk", 15], ["Almond", 15]]],
  ["ระดับความเผ็ด", false, [["ไม่เผ็ด", 0], ["เผ็ดน้อย", 0], ["เผ็ดปานกลาง", 0], ["เผ็ดมาก", 0]]],
  ["ไม่ใส่ผัก", false, [["ใส่ผักตามปกติ", 0], ["ไม่ใส่ผัก", 0]]],
  ["เพิ่มไข่", false, [["ไม่เพิ่ม", 0], ["เพิ่มไข่", 10]]],
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
