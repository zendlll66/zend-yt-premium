import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { customerInventories } from "@/db/schema/customer-inventory.schema";
import { customerInventoriesHybrid } from "@/db/schema/customer-inventory-hybrid.schema";
import { orders } from "@/db/schema/order.schema";
import type { InventoryItemType } from "@/db/schema/customer-inventory.schema";
import { expiresAtFromDurationMonths } from "@/lib/calendar-months";
import {
  durationDaysToMonthsApprox,
  getCustomerInventoryDurationSupport,
  monthsToDurationDaysApprox,
} from "@/features/inventory/customer-inventory-duration-support";

export async function addCustomerInventoryItem(data: {
  customerId: number;
  orderId: number;
  itemType: InventoryItemType;
  title: string;
  loginEmail?: string | null;
  loginPassword?: string | null;
  inviteLink?: string | null;
  durationMonths?: number;
  activatedAt?: Date | null;
  expiresAt?: Date | null;
  note?: string | null;
  /** เมื่อ true จะ insert เสมอ (ใช้เมื่อออเดอร์มีหลายรหัส เช่น หลาย individual ต่อออเดอร์) */
  insertOnly?: boolean;
  tx?: typeof db;
}) {
  const conn = data.tx ?? db;
  const durationMonths = Math.max(1, Math.floor(data.durationMonths ?? 1));
  const activatedAt = data.activatedAt ?? new Date();
  const expiresAt = data.expiresAt ?? expiresAtFromDurationMonths(activatedAt, durationMonths);
  const s = await getCustomerInventoryDurationSupport();
  if (!s.useDurationMonthsColumn && !s.useHybridDurationDays) {
    throw new Error(
      "customer_inventories: ต้องมีคอลัมน์ duration_months หรือ duration_days — รัน npm run db:migrate"
    );
  }

  if (s.useDurationMonthsColumn) {
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
            durationMonths,
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
        durationMonths,
        activatedAt,
        expiresAt,
        note: data.note ?? null,
        createdAt: new Date(),
      })
      .returning();
    return created ?? null;
  }

  const durationDays = monthsToDurationDaysApprox(durationMonths);

  if (!data.insertOnly) {
    const [existing] = await conn
      .select({ id: customerInventoriesHybrid.id })
      .from(customerInventoriesHybrid)
      .where(
        and(
          eq(customerInventoriesHybrid.customerId, data.customerId),
          eq(customerInventoriesHybrid.orderId, data.orderId),
          eq(customerInventoriesHybrid.itemType, data.itemType)
        )
      )
      .limit(1);

    if (existing) {
      const [updated] = await conn
        .update(customerInventoriesHybrid)
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
        .where(eq(customerInventoriesHybrid.id, existing.id))
        .returning();
      return updated ?? null;
    }
  }

  const [created] = await conn
    .insert(customerInventoriesHybrid)
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
  const s = await getCustomerInventoryDurationSupport();
  if (!s.useDurationMonthsColumn && !s.useHybridDurationDays) return [];
  if (s.useDurationMonthsColumn) {
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
        durationMonths: customerInventories.durationMonths,
        activatedAt: customerInventories.activatedAt,
        expiresAt: customerInventories.expiresAt,
        note: customerInventories.note,
        autoRenew: customerInventories.autoRenew,
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
      .orderBy(
        asc(sql`case when ${customerInventories.expiresAt} is null then 1 else 0 end`),
        asc(customerInventories.expiresAt),
        desc(customerInventories.createdAt)
      );
  }

  const rows = await db
    .select({
      id: customerInventoriesHybrid.id,
      orderId: customerInventoriesHybrid.orderId,
      orderNumber: orders.orderNumber,
      itemType: customerInventoriesHybrid.itemType,
      title: customerInventoriesHybrid.title,
      loginEmail: customerInventoriesHybrid.loginEmail,
      loginPassword: customerInventoriesHybrid.loginPassword,
      inviteLink: customerInventoriesHybrid.inviteLink,
      durationDays: customerInventoriesHybrid.durationDays,
      activatedAt: customerInventoriesHybrid.activatedAt,
      expiresAt: customerInventoriesHybrid.expiresAt,
      note: customerInventoriesHybrid.note,
      createdAt: customerInventoriesHybrid.createdAt,
    })
    .from(customerInventoriesHybrid)
    .leftJoin(orders, eq(customerInventoriesHybrid.orderId, orders.id))
    .where(
      and(
        eq(customerInventoriesHybrid.customerId, customerId),
        inArray(orders.status, ["paid", "fulfilled", "completed"])
      )
    )
    .orderBy(
      asc(sql`case when ${customerInventoriesHybrid.expiresAt} is null then 1 else 0 end`),
      asc(customerInventoriesHybrid.expiresAt),
      desc(customerInventoriesHybrid.createdAt)
    );

  return rows.map(({ durationDays, ...rest }) => ({
    ...rest,
    durationMonths: durationDaysToMonthsApprox(durationDays ?? 30),
    autoRenew: false as boolean,
  }));
}

export async function findCustomerInventoryById(customerId: number, inventoryId: number) {
  const s = await getCustomerInventoryDurationSupport();
  if (!s.useDurationMonthsColumn && !s.useHybridDurationDays) return null;
  if (s.useDurationMonthsColumn) {
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
        durationMonths: customerInventories.durationMonths,
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

  const rows = await db
    .select({
      id: customerInventoriesHybrid.id,
      orderId: customerInventoriesHybrid.orderId,
      orderNumber: orders.orderNumber,
      itemType: customerInventoriesHybrid.itemType,
      title: customerInventoriesHybrid.title,
      loginEmail: customerInventoriesHybrid.loginEmail,
      loginPassword: customerInventoriesHybrid.loginPassword,
      inviteLink: customerInventoriesHybrid.inviteLink,
      durationDays: customerInventoriesHybrid.durationDays,
      activatedAt: customerInventoriesHybrid.activatedAt,
      expiresAt: customerInventoriesHybrid.expiresAt,
      note: customerInventoriesHybrid.note,
      createdAt: customerInventoriesHybrid.createdAt,
    })
    .from(customerInventoriesHybrid)
    .leftJoin(orders, eq(customerInventoriesHybrid.orderId, orders.id))
    .where(
      and(
        eq(customerInventoriesHybrid.customerId, customerId),
        eq(customerInventoriesHybrid.id, inventoryId),
        inArray(orders.status, ["paid", "fulfilled", "completed"])
      )
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  const { durationDays, ...rest } = row;
  return {
    ...rest,
    durationMonths: durationDaysToMonthsApprox(durationDays ?? 30),
  };
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

  const s = await getCustomerInventoryDurationSupport();
  if (!s.useDurationMonthsColumn && !s.useHybridDurationDays) return null;
  if (s.useDurationMonthsColumn) {
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

  const hConditions = [
    eq(customerInventoriesHybrid.orderId, data.orderId),
    eq(customerInventoriesHybrid.itemType, data.itemType),
  ];
  if (data.loginEmail != null) hConditions.push(eq(customerInventoriesHybrid.loginEmail, data.loginEmail));
  if (data.inviteLink != null) hConditions.push(eq(customerInventoriesHybrid.inviteLink, data.inviteLink));

  const rows = await db
    .select({
      id: customerInventoriesHybrid.id,
      activatedAt: customerInventoriesHybrid.activatedAt,
      expiresAt: customerInventoriesHybrid.expiresAt,
      note: customerInventoriesHybrid.note,
    })
    .from(customerInventoriesHybrid)
    .where(and(...hConditions))
    .limit(1);

  return rows[0] ?? null;
}

export async function updateCustomerInventoriesDatesByOrderIdAndType(data: {
  orderId: number;
  itemType: InventoryItemType;
  activatedAt?: Date | null;
  expiresAt?: Date | null;
  note?: string | null;
}) {
  const set: Partial<typeof customerInventories.$inferInsert> = {};
  if (data.activatedAt !== undefined) set.activatedAt = data.activatedAt;
  if (data.expiresAt !== undefined) set.expiresAt = data.expiresAt;
  if (data.note !== undefined) set.note = data.note;
  if (Object.keys(set).length === 0) return 0;

  const s = await getCustomerInventoryDurationSupport();
  if (!s.useDurationMonthsColumn && !s.useHybridDurationDays) return 0;
  if (s.useDurationMonthsColumn) {
    const updated = await db
      .update(customerInventories)
      .set(set)
      .where(and(eq(customerInventories.orderId, data.orderId), eq(customerInventories.itemType, data.itemType)))
      .returning({ id: customerInventories.id });
    return updated.length;
  }

  const updated = await db
    .update(customerInventoriesHybrid)
    .set(set as Partial<typeof customerInventoriesHybrid.$inferInsert>)
    .where(
      and(eq(customerInventoriesHybrid.orderId, data.orderId), eq(customerInventoriesHybrid.itemType, data.itemType))
    )
    .returning({ id: customerInventoriesHybrid.id });

  return updated.length;
}
