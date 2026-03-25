"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { customerInventories } from "@/db/schema/customer-inventory.schema";
import { customers } from "@/db/schema/customer.schema";
import { orders } from "@/db/schema/order.schema";
import { pushLineTextMessage } from "@/lib/line-message";
import { getLineTemplate } from "@/features/support/line-template.repo";
import { and, eq, gte, lte } from "drizzle-orm";

type InventoryNotifyRow = {
  id: number;
  customerId: number | null;
  orderId: number | null;
  orderNumber: string | null;
  title: string;
  expiresAt: Date | null;
  customerName: string | null;
  customerEmail: string | null;
  customerLineUserId: string | null;
};

async function findInventoryWithCustomer(id: number): Promise<InventoryNotifyRow | null> {
  const [row] = await db
    .select({
      id: customerInventories.id,
      customerId: customerInventories.customerId,
      orderId: customerInventories.orderId,
      orderNumber: orders.orderNumber,
      title: customerInventories.title,
      expiresAt: customerInventories.expiresAt,
      customerName: customers.name,
      customerEmail: customers.email,
      customerLineUserId: customers.lineUserId,
    })
    .from(customerInventories)
    .leftJoin(orders, eq(customerInventories.orderId, orders.id))
    .leftJoin(customers, eq(customerInventories.customerId, customers.id))
    .where(eq(customerInventories.id, id))
    .limit(1);
  return row ?? null;
}

function formatDateTh(d: Date | null): string {
  if (!d) return "-";
  return new Date(d).toLocaleString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function renderTemplate(
  template: string,
  row: InventoryNotifyRow,
  extras: { daysLeft?: number | null; daysSinceExpired?: number | null }
): string {
  return template
    .replace(/{{name}}/g, row.customerName || "")
    .replace(/{{customerName}}/g, row.customerName || "")
    .replace(/{{title}}/g, row.title || "")
    .replace(/{{inventoryTitle}}/g, row.title || "")
    .replace(/{{orderNumber}}/g, row.orderNumber || String(row.orderId ?? ""))
    .replace(/{{expiresAt}}/g, formatDateTh(row.expiresAt))
    .replace(/{{daysLeft}}/g, extras.daysLeft != null ? String(extras.daysLeft) : "")
    .replace(
      /{{daysSinceExpired}}/g,
      extras.daysSinceExpired != null ? String(extras.daysSinceExpired) : ""
    );
}

export async function sendInventoryExpiringNotificationAction(formData: FormData) {
  const id = Number.parseInt(((formData.get("id") as string) ?? "").trim(), 10);
  if (!Number.isFinite(id)) return;
  const row = await findInventoryWithCustomer(id);
  if (!row?.customerLineUserId) return;

  const lineTpl = await getLineTemplate("inventory_expiring").catch(() => null);
  if (lineTpl?.isEnabled === false) return;
  const tpl =
    lineTpl?.template ||
    "⚠️ {{inventoryTitle}} ใกล้หมดอายุแล้ว\nOrder #{{orderNumber}} จะหมดอายุวันที่ {{expiresAt}} (อีก {{daysLeft}} วัน)";

  const now = new Date();
  const expires = row.expiresAt ? new Date(row.expiresAt) : null;
  const daysLeft =
    expires != null ? Math.floor((expires.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)) : null;

  const text = renderTemplate(tpl, row, { daysLeft });
  await pushLineTextMessage(row.customerLineUserId, text);
  revalidatePath("/dashboard/inventory/orders/expiring");
}

export async function sendInventoryExpiredNotificationAction(formData: FormData) {
  const id = Number.parseInt(((formData.get("id") as string) ?? "").trim(), 10);
  if (!Number.isFinite(id)) return;
  const row = await findInventoryWithCustomer(id);
  if (!row?.customerLineUserId) return;

  const lineTpl = await getLineTemplate("inventory_expired").catch(() => null);
  if (lineTpl?.isEnabled === false) return;
  const tpl =
    lineTpl?.template ||
    "❌ {{inventoryTitle}} หมดอายุแล้ว\nOrder #{{orderNumber}} หมดอายุวันที่ {{expiresAt}} ({{daysSinceExpired}} วันที่แล้ว)";

  const now = new Date();
  const expires = row.expiresAt ? new Date(row.expiresAt) : null;
  const daysSinceExpired =
    expires != null ? Math.floor((now.getTime() - expires.getTime()) / (24 * 60 * 60 * 1000)) : null;

  const text = renderTemplate(tpl, row, { daysSinceExpired });
  await pushLineTextMessage(row.customerLineUserId, text);
  revalidatePath("/dashboard/inventory/orders/expired");
}

async function listExpiringForNotify(warningDays: number): Promise<InventoryNotifyRow[]> {
  const now = new Date();
  const to = new Date(now.getTime() + warningDays * 24 * 60 * 60 * 1000);
  return db
    .select({
      id: customerInventories.id,
      customerId: customerInventories.customerId,
      orderId: customerInventories.orderId,
      orderNumber: orders.orderNumber,
      title: customerInventories.title,
      expiresAt: customerInventories.expiresAt,
      customerName: customers.name,
      customerEmail: customers.email,
      customerLineUserId: customers.lineUserId,
    })
    .from(customerInventories)
    .leftJoin(orders, eq(customerInventories.orderId, orders.id))
    .leftJoin(customers, eq(customerInventories.customerId, customers.id))
    .where(
      and(
        eq(orders.status, "paid"),
        gte(customerInventories.expiresAt, now),
        lte(customerInventories.expiresAt, to)
      )
    );
}

async function listExpiredForNotify(): Promise<InventoryNotifyRow[]> {
  const now = new Date();
  return db
    .select({
      id: customerInventories.id,
      customerId: customerInventories.customerId,
      orderId: customerInventories.orderId,
      orderNumber: orders.orderNumber,
      title: customerInventories.title,
      expiresAt: customerInventories.expiresAt,
      customerName: customers.name,
      customerEmail: customers.email,
      customerLineUserId: customers.lineUserId,
    })
    .from(customerInventories)
    .leftJoin(orders, eq(customerInventories.orderId, orders.id))
    .leftJoin(customers, eq(customerInventories.customerId, customers.id))
    .where(and(eq(orders.status, "paid"), lte(customerInventories.expiresAt, now)));
}

export async function sendAllExpiringNotificationsAction(formData: FormData) {
  const warningDays = Math.max(
    1,
    Number.parseInt(((formData.get("warningDays") as string) ?? "5").trim(), 10) || 5
  );
  const rows = await listExpiringForNotify(warningDays);
  const lineTpl = await getLineTemplate("inventory_expiring").catch(() => null);
  if (lineTpl?.isEnabled === false) { revalidatePath("/dashboard/inventory/orders/expiring"); return; }
  const tpl =
    lineTpl?.template ||
    "⚠️ {{inventoryTitle}} ใกล้หมดอายุแล้ว\nOrder #{{orderNumber}} จะหมดอายุวันที่ {{expiresAt}} (อีก {{daysLeft}} วัน)";

  const now = new Date();
  for (const row of rows) {
    if (!row.customerLineUserId) continue;
    const expires = row.expiresAt ? new Date(row.expiresAt) : null;
    const daysLeft =
      expires != null
        ? Math.floor((expires.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
        : null;
    const text = renderTemplate(tpl, row, { daysLeft });
    await pushLineTextMessage(row.customerLineUserId, text);
  }
  revalidatePath("/dashboard/inventory/orders/expiring");
}

export async function sendAllExpiredNotificationsAction() {
  const rows = await listExpiredForNotify();
  const lineTpl = await getLineTemplate("inventory_expired").catch(() => null);
  if (lineTpl?.isEnabled === false) { revalidatePath("/dashboard/inventory/orders/expired"); return; }
  const tpl =
    lineTpl?.template ||
    "❌ {{inventoryTitle}} หมดอายุแล้ว\nOrder #{{orderNumber}} หมดอายุวันที่ {{expiresAt}} ({{daysSinceExpired}} วันที่แล้ว)";

  const now = new Date();
  for (const row of rows) {
    if (!row.customerLineUserId) continue;
    const expires = row.expiresAt ? new Date(row.expiresAt) : null;
    const daysSinceExpired =
      expires != null
        ? Math.floor((now.getTime() - expires.getTime()) / (24 * 60 * 60 * 1000))
        : null;
    const text = renderTemplate(tpl, row, { daysSinceExpired });
    await pushLineTextMessage(row.customerLineUserId, text);
  }
  revalidatePath("/dashboard/inventory/orders/expired");
}

