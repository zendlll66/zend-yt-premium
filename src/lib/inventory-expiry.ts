import type { ShopSettings } from "@/features/settings/settings.repo";
import { expiresAtFromDurationMonths } from "@/lib/calendar-months";

/**
 * วันหมดอายุที่ใช้แสดง/นับวันเหลือ: ใช้ `expires_at` ในฐานข้อมูลก่อน
 * ถ้ายังไม่มีแต่มี `activated_at` + `duration_months` ให้คำนวณตามปฏิทิน (เช่น ซื้อวันที่ 1 → หมดวันที่ 1 เดือนถัดไป)
 */
export function effectiveInventoryExpiresAt(input: {
  expiresAt: Date | null | undefined;
  activatedAt: Date | null | undefined;
  durationMonths: number | null | undefined;
}): Date | null {
  if (input.expiresAt != null) {
    const d = input.expiresAt instanceof Date ? input.expiresAt : new Date(input.expiresAt);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const act = input.activatedAt;
  if (act == null) return null;
  const activated = act instanceof Date ? act : new Date(act);
  if (Number.isNaN(activated.getTime())) return null;
  const raw = input.durationMonths;
  const months =
    raw == null || !Number.isFinite(Number(raw)) ? 1 : Math.max(1, Math.floor(Number(raw)));
  return expiresAtFromDurationMonths(activated, months);
}

export function getInventoryExpiryWarningDays(
  settings?: Pick<ShopSettings, "inventoryExpiryWarningDays"> | null
) {
  const raw = settings?.inventoryExpiryWarningDays ?? "5";
  const n = Number.parseInt(String(raw), 10);
  return Math.max(1, Number.isFinite(n) && n > 0 ? n : 5);
}

export function daysLeft(expiresAt: Date | null, now = new Date()) {
  if (!expiresAt) return null;
  const diff = expiresAt.getTime() - now.getTime();
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

export function getDaysLeftDisplay(expiresAt: Date | null, warningDays: number) {
  const d = daysLeft(expiresAt);
  if (d == null) {
    return { text: "-", className: "text-muted-foreground" };
  }
  if (d <= 0) {
    return { text: "หมดอายุ", className: "text-destructive font-medium" };
  }
  return {
    text: `${d} วัน`,
    className: d <= warningDays ? "text-amber-600 font-medium" : "",
  };
}

