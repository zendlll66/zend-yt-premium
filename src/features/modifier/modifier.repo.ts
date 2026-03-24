import { asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  modifierGroups,
  modifiers,
  productModifiers,
} from "@/db/schema/modifier.schema";
import { accountStock } from "@/db/schema/account-stock.schema";
import { familyMembers } from "@/db/schema/family.schema";
import { orders } from "@/db/schema/order.schema";
import type { ProductStockType } from "@/db/schema/product.schema";
import {
  familyMemberCredentialOnlySql,
  familyMemberHasInviteUrlSql,
  familyMemberSlotOpenSql,
} from "@/features/youtube/family-stock-availability";

// ---------- Modifier Groups ----------

export type ModifierGroupWithModifiers = {
  id: number;
  name: string;
  required: boolean;
  modifiers: { id: number; name: string; price: number }[];
};

export async function findAllModifierGroups(): Promise<ModifierGroupWithModifiers[]> {
  const groups = await db
    .select()
    .from(modifierGroups)
    .orderBy(asc(modifierGroups.name));

  const mods = await db.select().from(modifiers).orderBy(asc(modifiers.name));

  const modsByGroup = mods.reduce(
    (acc, m) => {
      if (!acc[m.groupId]) acc[m.groupId] = [];
      acc[m.groupId].push({ id: m.id, name: m.name, price: m.price });
      return acc;
    },
    {} as Record<number, { id: number; name: string; price: number }[]>
  );

  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    required: g.required,
    modifiers: modsByGroup[g.id] ?? [],
  }));
}

export async function findModifierGroupById(id: number) {
  const [group] = await db
    .select()
    .from(modifierGroups)
    .where(eq(modifierGroups.id, id))
    .limit(1);
  return group ?? null;
}

export async function findModifierGroupWithModifiers(
  id: number
): Promise<ModifierGroupWithModifiers | null> {
  const group = await findModifierGroupById(id);
  if (!group) return null;

  const mods = await db
    .select({ id: modifiers.id, name: modifiers.name, price: modifiers.price })
    .from(modifiers)
    .where(eq(modifiers.groupId, id))
    .orderBy(asc(modifiers.name));

  return {
    id: group.id,
    name: group.name,
    required: group.required,
    modifiers: mods,
  };
}

export async function createModifierGroup(data: {
  name: string;
  required?: boolean;
}) {
  const [row] = await db.insert(modifierGroups).values({
    name: data.name,
    required: data.required ?? false,
  }).returning();
  return row ?? null;
}

export async function updateModifierGroup(
  id: number,
  data: { name?: string; required?: boolean }
) {
  const payload: Record<string, unknown> = {};
  if (data.name != null) payload.name = data.name;
  if (data.required != null) payload.required = data.required;
  if (Object.keys(payload).length === 0) return findModifierGroupById(id);
  const [row] = await db
    .update(modifierGroups)
    .set(payload as Partial<typeof modifierGroups.$inferInsert>)
    .where(eq(modifierGroups.id, id))
    .returning();
  return row ?? null;
}

export async function deleteModifierGroupById(id: number): Promise<boolean> {
  const [row] = await db
    .delete(modifierGroups)
    .where(eq(modifierGroups.id, id))
    .returning({ id: modifierGroups.id });
  return row != null;
}

// ---------- Modifiers (options in a group) ----------

export async function findModifierById(id: number) {
  const [row] = await db
    .select()
    .from(modifiers)
    .where(eq(modifiers.id, id))
    .limit(1);
  return row ?? null;
}

export async function createModifier(data: {
  groupId: number;
  name: string;
  price?: number;
}) {
  const [row] = await db.insert(modifiers).values({
    groupId: data.groupId,
    name: data.name,
    price: data.price ?? 0,
  }).returning();
  return row ?? null;
}

export async function updateModifier(
  id: number,
  data: { name?: string; price?: number }
) {
  const payload: Record<string, unknown> = {};
  if (data.name != null) payload.name = data.name;
  if (data.price != null) payload.price = data.price;
  if (Object.keys(payload).length === 0) return findModifierById(id);
  const [row] = await db
    .update(modifiers)
    .set(payload as Partial<typeof modifiers.$inferInsert>)
    .where(eq(modifiers.id, id))
    .returning();
  return row ?? null;
}

export async function deleteModifierById(id: number): Promise<boolean> {
  const [row] = await db
    .delete(modifiers)
    .where(eq(modifiers.id, id))
    .returning({ id: modifiers.id });
  return row != null;
}

// ---------- Product-Modifier mapping ----------

export async function getModifierGroupIdsByProductId(
  productId: number
): Promise<number[]> {
  const rows = await db
    .select({ modifierGroupId: productModifiers.modifierGroupId })
    .from(productModifiers)
    .where(eq(productModifiers.productId, productId));
  return rows.map((r) => r.modifierGroupId);
}

export async function setProductModifierGroups(
  productId: number,
  modifierGroupIds: number[]
) {
  await db.delete(productModifiers).where(eq(productModifiers.productId, productId));
  if (modifierGroupIds.length === 0) return;

  await db.insert(productModifiers).values(
    modifierGroupIds.map((modifierGroupId) => ({
      productId,
      modifierGroupId,
    }))
  );
}

/** เมนูสำหรับหน้าสั่งอาหาร: สินค้าที่ขายได้ + กลุ่มตัวเลือกของแต่ละรายการ */
export type MenuProduct = {
  id: number;
  name: string;
  price: number;
  imageUrl: string | null;
  categoryId: number | null;
  categoryName: string | null;
  stockType: ProductStockType;
  /** จำนวนคงเหลือตาม stock type */
  stock: number;
  modifierGroups: {
    id: number;
    name: string;
    required: boolean;
    modifiers: { id: number; name: string; price: number }[];
  }[];
};

export async function getMenuForOrder(): Promise<MenuProduct[]> {
  const { products } = await import("@/db/schema/product.schema");
  const { categories } = await import("@/db/schema/category.schema");

  const [individualRow, familyRow, inviteRow] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(accountStock)
      .where(eq(accountStock.status, "available")),
    db
      .select({
        count: sql<number>`coalesce(sum(
          case
            when ${familyMemberCredentialOnlySql} and ${familyMemberSlotOpenSql} then 1
            else 0
          end
        ), 0)`,
      })
      .from(familyMembers)
      .leftJoin(orders, eq(familyMembers.orderId, orders.id)),
    db
      .select({
        count: sql<number>`coalesce(sum(
          case
            when ${familyMemberHasInviteUrlSql} and ${familyMemberSlotOpenSql} then 1
            else 0
          end
        ), 0)`,
      })
      .from(familyMembers)
      .leftJoin(orders, eq(familyMembers.orderId, orders.id)),
  ]);
  const stockByType: Record<ProductStockType, number> = {
    individual: Number(individualRow[0]?.count ?? 0),
    family: Number(familyRow[0]?.count ?? 0),
    invite: Number(inviteRow[0]?.count ?? 0),
    customer_account: Number.MAX_SAFE_INTEGER,
  };

  const activeProducts = await (async () => {
    try {
      return await db
        .select({
          id: products.id,
          name: products.name,
          price: products.price,
          imageUrl: products.imageUrl,
          categoryId: products.categoryId,
          categoryName: categories.name,
          stockType: products.stockType,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(eq(products.isActive, true))
        .orderBy(asc(categories.name), asc(products.name));
    } catch {
      const legacyRows = await db
        .select({
          id: products.id,
          name: products.name,
          price: products.price,
          imageUrl: products.imageUrl,
          categoryId: products.categoryId,
          categoryName: categories.name,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(eq(products.isActive, true))
        .orderBy(asc(categories.name), asc(products.name));
      return legacyRows.map((r) => ({ ...r, stockType: "individual" as ProductStockType }));
    }
  })();

  const productIds = activeProducts.map((p) => p.id);
  if (productIds.length === 0) return [];

  const links = await db
    .select({ productId: productModifiers.productId, modifierGroupId: productModifiers.modifierGroupId })
    .from(productModifiers)
    .where(inArray(productModifiers.productId, productIds));

  const groupIds = [...new Set(links.map((l) => l.modifierGroupId))];
  const allGroups = await db.select().from(modifierGroups).where(inArray(modifierGroups.id, groupIds));
  const allMods = groupIds.length
    ? await db.select().from(modifiers).where(inArray(modifiers.groupId, groupIds))
    : [];
  const modsByGroup = allMods.reduce(
    (acc, m) => {
      if (!acc[m.groupId]) acc[m.groupId] = [];
      acc[m.groupId].push({ id: m.id, name: m.name, price: m.price });
      return acc;
    },
    {} as Record<number, { id: number; name: string; price: number }[]>
  );

  const groupsByProduct = links.reduce(
    (acc, l) => {
      if (!acc[l.productId]) acc[l.productId] = [];
      if (!acc[l.productId].includes(l.modifierGroupId)) acc[l.productId].push(l.modifierGroupId);
      return acc;
    },
    {} as Record<number, number[]>
  );

  return activeProducts.map((p) => {
    const gIds = groupsByProduct[p.id] ?? [];
    const modifierGroups = gIds
      .map((gid) => allGroups.find((g) => g.id === gid))
      .filter(Boolean)
      .map((g) => ({
        id: g!.id,
        name: g!.name,
        required: g!.required,
        modifiers: modsByGroup[g!.id] ?? [],
      }));
    return {
      id: p.id,
      name: p.name,
      price: p.price,
      imageUrl: p.imageUrl ?? null,
      categoryId: p.categoryId ?? null,
      categoryName: p.categoryName ?? null,
      stockType: p.stockType,
      stock: stockByType[p.stockType] ?? 0,
      modifierGroups,
    };
  });
}
