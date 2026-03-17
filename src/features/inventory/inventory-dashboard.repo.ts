import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { customerInventories } from "@/db/schema/customer-inventory.schema";
import { customers } from "@/db/schema/customer.schema";
import { orders } from "@/db/schema/order.schema";

function now(): Date {
  return new Date();
}

export async function findActiveInventories() {
  const today = now();
  return db
    .select({
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
      durationDays: customerInventories.durationDays,
      customerName: customers.name,
      customerEmail: customers.email,
      customerLineDisplayName: customers.lineDisplayName,
      customerLinePictureUrl: customers.linePictureUrl,
    })
    .from(customerInventories)
    .leftJoin(orders, eq(customerInventories.orderId, orders.id))
    .leftJoin(customers, eq(customerInventories.customerId, customers.id))
    .where(
      and(
        eq(orders.status, "paid"),
        gte(customerInventories.expiresAt, today)
      )
    )
    .orderBy(desc(customerInventories.expiresAt));
}

export async function findExpiringInventories(warningDays: number) {
  const from = now();
  const to = new Date(from.getTime() + warningDays * 24 * 60 * 60 * 1000);
  return db
    .select({
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
      durationDays: customerInventories.durationDays,
      customerName: customers.name,
      customerEmail: customers.email,
      customerLineDisplayName: customers.lineDisplayName,
      customerLinePictureUrl: customers.linePictureUrl,
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

export async function findExpiredInventories() {
  const today = now();
  return db
    .select({
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
      durationDays: customerInventories.durationDays,
      customerName: customers.name,
      customerEmail: customers.email,
      customerLineDisplayName: customers.lineDisplayName,
      customerLinePictureUrl: customers.linePictureUrl,
    })
    .from(customerInventories)
    .leftJoin(orders, eq(customerInventories.orderId, orders.id))
    .leftJoin(customers, eq(customerInventories.customerId, customers.id))
    .where(
      and(
        eq(orders.status, "paid"),
        lte(customerInventories.expiresAt, today)
      )
    )
    .orderBy(desc(customerInventories.expiresAt));
}

