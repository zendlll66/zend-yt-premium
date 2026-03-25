import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { customerInventories } from "@/db/schema/customer-inventory.schema";
import { customerInventoriesHybrid } from "@/db/schema/customer-inventory-hybrid.schema";
import { customers } from "@/db/schema/customer.schema";
import { orders } from "@/db/schema/order.schema";
import {
  durationDaysToMonthsApprox,
  getCustomerInventoryDurationSupport,
} from "@/features/inventory/customer-inventory-duration-support";

function now(): Date {
  return new Date();
}

const baseInventoryFields = {
  id: customerInventories.id,
  customerId: customerInventories.customerId,
  orderId: customerInventories.orderId,
  orderNumber: orders.orderNumber,
  orderStatus: orders.status,
  itemType: customerInventories.itemType,
  title: customerInventories.title,
  loginEmail: customerInventories.loginEmail,
  loginPassword: customerInventories.loginPassword,
  inviteLink: customerInventories.inviteLink,
  activatedAt: customerInventories.activatedAt,
  expiresAt: customerInventories.expiresAt,
  customerName: customers.name,
  customerEmail: customers.email,
  customerLineDisplayName: customers.lineDisplayName,
  customerLinePictureUrl: customers.linePictureUrl,
};

const hybridInventoryFields = {
  id: customerInventoriesHybrid.id,
  customerId: customerInventoriesHybrid.customerId,
  orderId: customerInventoriesHybrid.orderId,
  orderNumber: orders.orderNumber,
  orderStatus: orders.status,
  itemType: customerInventoriesHybrid.itemType,
  title: customerInventoriesHybrid.title,
  loginEmail: customerInventoriesHybrid.loginEmail,
  loginPassword: customerInventoriesHybrid.loginPassword,
  inviteLink: customerInventoriesHybrid.inviteLink,
  activatedAt: customerInventoriesHybrid.activatedAt,
  expiresAt: customerInventoriesHybrid.expiresAt,
  durationDays: customerInventoriesHybrid.durationDays,
  customerName: customers.name,
  customerEmail: customers.email,
  customerLineDisplayName: customers.lineDisplayName,
  customerLinePictureUrl: customers.linePictureUrl,
};

export async function findActiveInventories() {
  const today = now();
  const s = await getCustomerInventoryDurationSupport();
  if (!s.useDurationMonthsColumn && !s.useHybridDurationDays) return [];
  if (s.useDurationMonthsColumn) {
    return db
      .select({
        ...baseInventoryFields,
        durationMonths: customerInventories.durationMonths,
      })
      .from(customerInventories)
      .leftJoin(orders, eq(customerInventories.orderId, orders.id))
      .leftJoin(customers, eq(customerInventories.customerId, customers.id))
      .where(and(eq(orders.status, "paid"), gte(customerInventories.expiresAt, today)))
      .orderBy(desc(customerInventories.expiresAt));
  }

  const rows = await db
    .select(hybridInventoryFields)
    .from(customerInventoriesHybrid)
    .leftJoin(orders, eq(customerInventoriesHybrid.orderId, orders.id))
    .leftJoin(customers, eq(customerInventoriesHybrid.customerId, customers.id))
    .where(and(eq(orders.status, "paid"), gte(customerInventoriesHybrid.expiresAt, today)))
    .orderBy(desc(customerInventoriesHybrid.expiresAt));

  return rows.map(({ durationDays, ...rest }) => ({
    ...rest,
    durationMonths: durationDaysToMonthsApprox(durationDays ?? 30),
  }));
}

export async function findExpiringInventories(warningDays: number) {
  const from = now();
  const to = new Date(from.getTime() + warningDays * 24 * 60 * 60 * 1000);
  const s = await getCustomerInventoryDurationSupport();
  if (!s.useDurationMonthsColumn && !s.useHybridDurationDays) return [];
  if (s.useDurationMonthsColumn) {
    return db
      .select({
        ...baseInventoryFields,
        durationMonths: customerInventories.durationMonths,
      })
      .from(customerInventories)
      .leftJoin(orders, eq(customerInventories.orderId, orders.id))
      .leftJoin(customers, eq(customerInventories.customerId, customers.id))
      .where(
        and(
          eq(orders.status, "paid"),
          gte(customerInventories.expiresAt, from),
          lte(customerInventories.expiresAt, to)
        )
      )
      .orderBy(desc(customerInventories.expiresAt));
  }

  const rows = await db
    .select(hybridInventoryFields)
    .from(customerInventoriesHybrid)
    .leftJoin(orders, eq(customerInventoriesHybrid.orderId, orders.id))
    .leftJoin(customers, eq(customerInventoriesHybrid.customerId, customers.id))
    .where(
      and(
        eq(orders.status, "paid"),
        gte(customerInventoriesHybrid.expiresAt, from),
        lte(customerInventoriesHybrid.expiresAt, to)
      )
    )
    .orderBy(desc(customerInventoriesHybrid.expiresAt));

  return rows.map(({ durationDays, ...rest }) => ({
    ...rest,
    durationMonths: durationDaysToMonthsApprox(durationDays ?? 30),
  }));
}

export async function findExpiredInventories() {
  const today = now();
  const s = await getCustomerInventoryDurationSupport();
  if (!s.useDurationMonthsColumn && !s.useHybridDurationDays) return [];
  if (s.useDurationMonthsColumn) {
    return db
      .select({
        ...baseInventoryFields,
        durationMonths: customerInventories.durationMonths,
      })
      .from(customerInventories)
      .leftJoin(orders, eq(customerInventories.orderId, orders.id))
      .leftJoin(customers, eq(customerInventories.customerId, customers.id))
      .where(and(eq(orders.status, "paid"), lte(customerInventories.expiresAt, today)))
      .orderBy(desc(customerInventories.expiresAt));
  }

  const rows = await db
    .select(hybridInventoryFields)
    .from(customerInventoriesHybrid)
    .leftJoin(orders, eq(customerInventoriesHybrid.orderId, orders.id))
    .leftJoin(customers, eq(customerInventoriesHybrid.customerId, customers.id))
    .where(and(eq(orders.status, "paid"), lte(customerInventoriesHybrid.expiresAt, today)))
    .orderBy(desc(customerInventoriesHybrid.expiresAt));

  return rows.map(({ durationDays, ...rest }) => ({
    ...rest,
    durationMonths: durationDaysToMonthsApprox(durationDays ?? 30),
  }));
}
