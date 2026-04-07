/** ต้องสอดคล้องกับ schedule ของ cron inventory-notify (เช่น ทุก 5 นาที) */
export const INVENTORY_NOTIFY_CRON_STEP_MINUTES = 5;

export type LocalHm = { h: number; m: number };

/** แยกรายการเวลา เช่น "9:00, 12:30, 18" → [{h,m}, …] */
export function parseTimeList(raw: string): LocalHm[] {
  const out: LocalHm[] = [];
  for (const part of raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)) {
    const hm = /^(\d{1,2}):(\d{2})$/.exec(part);
    const hOnly = /^(\d{1,2})$/.exec(part);
    if (hm) {
      const hh = Number.parseInt(hm[1], 10);
      const mm = Number.parseInt(hm[2], 10);
      if (Number.isFinite(hh) && Number.isFinite(mm) && hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) {
        out.push({ h: hh, m: mm });
      }
    } else if (hOnly) {
      const hh = Number.parseInt(hOnly[1], 10);
      if (Number.isFinite(hh) && hh >= 0 && hh <= 23) {
        out.push({ h: hh, m: 0 });
      }
    }
  }
  return out;
}

export function getLocalHm(now: Date, timeZone: string): LocalHm {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const hh = Number.parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const mm = Number.parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  return {
    h: Number.isFinite(hh) ? hh : 0,
    m: Number.isFinite(mm) ? mm : 0,
  };
}

function minutesFromMidnight(t: LocalHm): number {
  return t.h * 60 + t.m;
}

/**
 * จับคู่เวลาปัจจุบันกับช่วงสล็อตตามขนาดขั้น cron (นาที)
 * ให้ส่งได้ครั้งหนึ่งต่อช่วงขั้น เมื่อ cron รันบ่อยพอ (เช่น ทุก 5 นาที)
 */
export function matchesTimeListInTimezone(
  now: Date,
  timeZone: string,
  raw: string,
  stepMinutes: number = INVENTORY_NOTIFY_CRON_STEP_MINUTES
): boolean {
  const slots = parseTimeList(raw);
  if (slots.length === 0) return false;
  const { h, m } = getLocalHm(now, timeZone);
  const nowTotal = minutesFromMidnight({ h, m });
  const bucket = (total: number) => Math.floor(total / stepMinutes);
  const bNow = bucket(nowTotal);
  for (const s of slots) {
    const slotTotal = minutesFromMidnight(s);
    if (bNow === bucket(slotTotal)) return true;
  }
  return false;
}
