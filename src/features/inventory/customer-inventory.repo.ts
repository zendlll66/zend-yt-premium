import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { customerInventories } from "@/db/schema/customer-inventory.schema";
import { orders } from "@/db/schema/order.schema";
import type { InventoryItemType } from "@/db/schema/customer-inventory.schema";

export async function addCustomerInventoryItem(data: {
  customerId: number;
  orderId: number;
  itemType: InventoryItemType;
  title: string;
  loginEmail?: string | null;
  loginPassword?: string | null;
  inviteLink?: string | null;
  durationDays?: number;
  activatedAt?: Date | null;
  expiresAt?: Date | null;
  note?: string | null;
  /** เมื่อ true จะ insert เสมอ (ใช้เมื่อออเดอร์มีหลายรหัส เช่น หลาย individual ต่อออเดอร์) */
  insertOnly?: boolean;
  tx?: typeof db;
}) {
  const conn = data.tx ?? db;
  const durationDays = Math.max(1, Math.floor(data.durationDays ?? 30));
  const activatedAt = data.activatedAt ?? new Date();
  const expiresAt =
    data.expiresAt ?? new Date(activatedAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

  if (!data.insertOnly) {
    const [existing] = await conn
      .select({ id: customerInventories.id })
      .from(customerInventories)
      .where(
        and(
          eq(customerInventories.customerId, data.customerId),
          eq(customerInventories.orderId, data.orderId),
          eq(customerInventories.itemType, data.itemType)
        )
      )
      .limit(1);

    if (existing) {
    const [updated] = await conn
      .update(customerInventories)
      .set({
        title: data.title,
        loginEmail: data.loginEmail ?? null,
        loginPassword: data.loginPassword ?? null,
        inviteLink: data.inviteLink ?? null,
        durationDays,
        activatedAt,
        expiresAt,
        note: data.note ?? null,
      })
      .where(eq(customerInventories.id, existing.id))
      .returning();
      return updated ?? null;
    }
  }

  const [created] = await conn
    .insert(customerInventories)
    .values({
      customerId: data.customerId,
      orderId: data.orderId,
      itemType: data.itemType,
      title: data.title,
      loginEmail: data.loginEmail ?? null,
      loginPassword: data.loginPassword ?? null,
      inviteLink: data.inviteLink ?? null,
      durationDays,
      activatedAt,
      expiresAt,
      note: data.note ?? null,
      createdAt: new Date(),
    })
    .returning();
  return created ?? null;
}

export async function findCustomerInventory(customerId: number) {
  return db
    .select({
      id: customerInventories.id,
      orderId: customerInventories.orderId,
      orderNumber: orders.orderNumber,
      itemType: customerInventories.itemType,
      title: customerInventories.title,
      loginEmail: customerInventories.loginEmail,
      loginPassword: customerInventories.loginPassword,
      inviteLink: customerInventories.inviteLink,
      durationDays: customerInventories.durationDays,
      activatedAt: customerInventories.activatedAt,
      expiresAt: customerInventories.expiresAt,
      note: customerInventories.note,
      createdAt: customerInventories.createdAt,
    })
    .from(customerInventories)
    .leftJoin(orders, eq(customerInventories.orderId, orders.id))
    .where(
      and(
        eq(customerInventories.customerId, customerId),
        inArray(orders.status, ["paid", "fulfilled", "completed"])
      )
    )
    .orderBy(desc(customerInventories.createdAt));
}

export async function findCustomerInventoryById(customerId: number, inventoryId: number) {
  const rows = await db
    .select({
      id: customerInventories.id,
      orderId: customerInventories.orderId,
      orderNumber: orders.orderNumber,
      itemType: customerInventories.itemType,
      title: customerInventories.title,
      loginEmail: customerInventories.loginEmail,
      loginPassword: customerInventories.loginPassword,
      inviteLink: customerInventories.inviteLink,
      durationDays: customerInventories.durationDays,
      activatedAt: customerInventories.activatedAt,
      expiresAt: customerInventories.expiresAt,
      note: customerInventories.note,
      createdAt: customerInventories.createdAt,
    })
    .from(customerInventories)
    .leftJoin(orders, eq(customerInventories.orderId, orders.id))
    .where(
      and(
        eq(customerInventories.customerId, customerId),
        eq(customerInventories.id, inventoryId),
        inArray(orders.status, ["paid", "fulfilled", "completed"])
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function findCustomerInventoryForOrderItem(data: {
  orderId: number;
  itemType: InventoryItemType;
  loginEmail?: string | null;
  inviteLink?: string | null;
}) {
  const conditions = [
    eq(customerInventories.orderId, data.orderId),
    eq(customerInventories.itemType, data.itemType),
  ];

  if (data.loginEmail != null) conditions.push(eq(customerInventories.loginEmail, data.loginEmail));
  if (data.inviteLink != null) conditions.push(eq(customerInventories.inviteLink, data.inviteLink));

  const rows = await db
    .select({
      id: customerInventories.id,
      activatedAt: customerInventories.activatedAt,
      expiresAt: customerInventories.expiresAt,
      note: customerInventories.note,
    })
    .from(customerInventories)
    .where(and(...conditions))
    .limit(1);

  return rows[0] ?? null;
}

