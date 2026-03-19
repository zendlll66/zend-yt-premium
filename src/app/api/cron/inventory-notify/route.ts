import { NextResponse } from "next/server";
import { and, eq, gte, lte, lt } from "drizzle-orm";
import { db } from "@/db";
import { customerInventories } from "@/db/schema/customer-inventory.schema";
import { customers } from "@/db/schema/customer.schema";
import { orders } from "@/db/schema/order.schema";
import { getShopSettings } from "@/features/settings/settings.repo";
import { pushLineTextMessage } from "@/lib/line-message";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function formatDateTh(d: Date | null): string {
  if (!d) return "-";
  return new Date(d).toLocaleString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

type InventoryCronRow = {
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

function renderTemplate(
  template: string,
  row: InventoryCronRow,
  extras: { daysLeft?: number | null; daysSinceExpired?: number | null }
): string {
  return template
    .replace(/{{name}}/g, row.customerName || "")
    .replace(/{{title}}/g, row.title || "")
    .replace(/{{orderNumber}}/g, row.orderNumber || String(row.orderId ?? ""))
    .replace(/{{expiresAt}}/g, formatDateTh(row.expiresAt))
    .replace(/{{daysLeft}}/g, extras.daysLeft != null ? String(extras.daysLeft) : "")
    .replace(
      /{{daysSinceExpired}}/g,
      extras.daysSinceExpired != null ? String(extras.daysSinceExpired) : ""
    );
}

export async function GET() {
  const settings = await getShopSettings();
  const warningDays = Math.max(
    1,
    Number.parseInt(settings.inventoryExpiryWarningDays || "5", 10) || 5
  );
  const warningMode = settings.inventoryExpiryWarningMode || "once";
  const expiredMode = settings.inventoryExpiredMode || "once";
  const expiredRepeatDays =
    Number.parseInt(settings.inventoryExpiredRepeatDays || "3", 10) || 3;

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  // ใกล้หมดอายุ
  const warningFrom = todayStart;
  const warningTo = new Date(
    warningFrom.getTime() + warningDays * 24 * 60 * 60 * 1000
  );

  const expiringRows: InventoryCronRow[] =
    warningMode === "once"
      ? await db
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
          .leftJoin(orders, eq(orders.id, customerInventories.orderId))
          .leftJoin(customers, eq(customers.id, customerInventories.customerId))
          .where(
            and(
              gte(customerInventories.expiresAt, warningFrom),
              lte(customerInventories.expiresAt, warningTo)
            )
          )
      : await db
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
          .leftJoin(orders, eq(orders.id, customerInventories.orderId))
          .leftJoin(customers, eq(customers.id, customerInventories.customerId))
          .where(
            and(
              gte(customerInventories.expiresAt, todayStart),
              lte(customerInventories.expiresAt, warningTo)
            )
          );

  const warningTemplate =
    settings.inventoryExpiryWarningMessage ||
    "รายการ {{title}} ใกล้หมดอายุแล้ว (ออเดอร์ {{orderNumber}}) จะหมดอายุวันที่ {{expiresAt}}";

  for (const row of expiringRows) {
    if (!row.customerLineUserId || !row.expiresAt) continue;
    const expires = new Date(row.expiresAt);
    const daysLeft = Math.floor(
      (expires.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000)
    );
    if (daysLeft < 0) continue;
    if (warningMode === "once" && daysLeft !== warningDays) continue;
    const text = renderTemplate(warningTemplate, row, { daysLeft });
    await pushLineTextMessage(row.customerLineUserId, text);
  }

  // หมดอายุแล้ว
  const expiredRows: InventoryCronRow[] =
    expiredMode === "once"
      ? await db
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
          .leftJoin(orders, eq(orders.id, customerInventories.orderId))
          .leftJoin(customers, eq(customers.id, customerInventories.customerId))
          .where(
            and(
              gte(customerInventories.expiresAt, todayStart),
              lte(customerInventories.expiresAt, todayEnd)
            )
          )
      : await db
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
          .leftJoin(orders, eq(orders.id, customerInventories.orderId))
          .leftJoin(customers, eq(customers.id, customerInventories.customerId))
          .where(lt(customerInventories.expiresAt, todayEnd));

  const expiredTemplate =
    settings.inventoryExpiredMessage ||
    "รายการ {{title}} (ออเดอร์ {{orderNumber}}) หมดอายุแล้วตั้งแต่วันที่ {{expiresAt}}";

  for (const row of expiredRows) {
    if (!row.customerLineUserId || !row.expiresAt) continue;
    const expires = new Date(row.expiresAt);
    const daysSince = Math.floor(
      (todayStart.getTime() - startOfDay(expires).getTime()) / (24 * 60 * 60 * 1000)
    );
    if (daysSince < 0) continue;
    if (expiredMode === "once" && daysSince !== 0) continue;
    if (expiredMode === "daily" && daysSince >= expiredRepeatDays) continue;
    const text = renderTemplate(expiredTemplate, row, { daysSinceExpired: daysSince });
    await pushLineTextMessage(row.customerLineUserId, text);
  }

  return NextResponse.json({
    ok: true,
    warningMode,
    expiredMode,
  });
}

