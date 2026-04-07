import { NextResponse } from "next/server";
import { and, eq, gte, lte, lt } from "drizzle-orm";
import { db } from "@/db";
import { customerInventories } from "@/db/schema/customer-inventory.schema";
import { customers } from "@/db/schema/customer.schema";
import { orders } from "@/db/schema/order.schema";
import { getShopSettings } from "@/features/settings/settings.repo";
import { pushLineTextMessage } from "@/lib/line-message";
import { getLineTemplate } from "@/features/support/line-template.repo";
import {
  getLocalHm,
  matchesTimeListInTimezone,
  parseTimeList,
} from "@/lib/inventory-notify-schedule";

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

/** GET /api/cron/inventory-notify — เรียกจาก Vercel Cron / external scheduler; ตั้ง CRON_SECRET แล้วส่ง Authorization: Bearer */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const debug = url.searchParams.get("debug") === "1";

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("Authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

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
  const notifyTimezone = settings.timezone || "Asia/Bangkok";

  const timesWarningOnce = settings.inventoryExpiryWarningTimesOnce;
  const timesWarningDaily = settings.inventoryExpiryWarningTimesDaily;
  const timesExpiredOnce = settings.inventoryExpiredTimesOnce;
  const timesExpiredDaily = settings.inventoryExpiredTimesDaily;

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

  const warningLineTpl = await getLineTemplate("inventory_expiring").catch(() => null);
  const warningTemplate =
    (warningLineTpl?.isEnabled !== false && warningLineTpl?.template) ||
    settings.inventoryExpiryWarningMessage ||
    "⚠️ {{inventoryTitle}} ใกล้หมดอายุแล้ว\nOrder #{{orderNumber}} จะหมดอายุวันที่ {{expiresAt}} (อีก {{daysLeft}} วัน)";

  const lineTokenConfigured = Boolean(
    process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN || process.env.LINE_CHANNEL_ACCESS_TOKEN
  );

  let warningPushCount = 0;
  for (const row of expiringRows) {
    if (!row.customerLineUserId || !row.expiresAt) continue;
    const expires = new Date(row.expiresAt);
    const daysLeft = Math.floor(
      (expires.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000)
    );
    if (daysLeft < 0) continue;
    if (warningMode === "once") {
      if (daysLeft !== warningDays) continue;
      if (!matchesTimeListInTimezone(now, notifyTimezone, timesWarningOnce)) continue;
    } else {
      if (!matchesTimeListInTimezone(now, notifyTimezone, timesWarningDaily)) continue;
    }
    const text = renderTemplate(warningTemplate, row, { daysLeft });
    const ok = await pushLineTextMessage(row.customerLineUserId, text);
    if (ok) warningPushCount += 1;
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

  const expiredLineTpl = await getLineTemplate("inventory_expired").catch(() => null);
  const expiredTemplate =
    (expiredLineTpl?.isEnabled !== false && expiredLineTpl?.template) ||
    settings.inventoryExpiredMessage ||
    "❌ {{inventoryTitle}} หมดอายุแล้ว\nOrder #{{orderNumber}} หมดอายุวันที่ {{expiresAt}} ({{daysSinceExpired}} วันที่แล้ว)";

  let expiredPushCount = 0;
  for (const row of expiredRows) {
    if (!row.customerLineUserId || !row.expiresAt) continue;
    const expires = new Date(row.expiresAt);
    const daysSince = Math.floor(
      (todayStart.getTime() - startOfDay(expires).getTime()) / (24 * 60 * 60 * 1000)
    );
    if (daysSince < 0) continue;
    if (expiredMode === "once") {
      if (daysSince !== 0) continue;
      if (!matchesTimeListInTimezone(now, notifyTimezone, timesExpiredOnce)) continue;
    } else {
      if (daysSince >= expiredRepeatDays) continue;
      if (!matchesTimeListInTimezone(now, notifyTimezone, timesExpiredDaily)) continue;
    }
    const text = renderTemplate(expiredTemplate, row, { daysSinceExpired: daysSince });
    const ok = await pushLineTextMessage(row.customerLineUserId, text);
    if (ok) expiredPushCount += 1;
  }

  const localHm = getLocalHm(now, notifyTimezone);
  const hmStr = `${String(localHm.h).padStart(2, "0")}:${String(localHm.m).padStart(2, "0")}`;

  const payload: Record<string, unknown> = {
    ok: true,
    warningMode,
    expiredMode,
    warningPushCount,
    expiredPushCount,
  };

  if (debug) {
    const expiringWithLine = expiringRows.filter((r) => r.customerLineUserId && r.expiresAt).length;
    const expiredWithLine = expiredRows.filter((r) => r.customerLineUserId && r.expiresAt).length;
    payload.debug = {
      timezone: notifyTimezone,
      localTime: hmStr,
      inventoryExpiryWarningDays: warningDays,
      lineTokenConfigured,
      hint:
        "LINE จะส่งเมื่อ (1) มี LINE token ใน env (2) ลูกค้ามี lineUserId (3) เวลาปัจจุบันตรงสล็อต HH:mm ตาม timezone ร้าน (4) รายการเข้าเงื่อนไขวันคงเหลือ/หมดอายุ",
      warning: {
        queryRowCount: expiringRows.length,
        rowsWithLineUserId: expiringWithLine,
        timesRaw:
          warningMode === "once" ? timesWarningOnce : timesWarningDaily,
        parsedSlotCount: parseTimeList(
          warningMode === "once" ? timesWarningOnce : timesWarningDaily
        ).length,
        timeMatchesNow:
          warningMode === "once"
            ? matchesTimeListInTimezone(now, notifyTimezone, timesWarningOnce)
            : matchesTimeListInTimezone(now, notifyTimezone, timesWarningDaily),
      },
      expired: {
        queryRowCount: expiredRows.length,
        rowsWithLineUserId: expiredWithLine,
        timesRaw:
          expiredMode === "once" ? timesExpiredOnce : timesExpiredDaily,
        parsedSlotCount: parseTimeList(
          expiredMode === "once" ? timesExpiredOnce : timesExpiredDaily
        ).length,
        timeMatchesNow:
          expiredMode === "once"
            ? matchesTimeListInTimezone(now, notifyTimezone, timesExpiredOnce)
            : matchesTimeListInTimezone(now, notifyTimezone, timesExpiredDaily),
        expiredRepeatDays,
      },
    };
  }

  return NextResponse.json(payload);
}
