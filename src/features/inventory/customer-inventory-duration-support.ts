import { db } from "@/db";

export type CustomerInventoryDurationSupport = {
  useDurationMonthsColumn: boolean;
  useHybridDurationDays: boolean;
};

let cache: CustomerInventoryDurationSupport | null = null;

export function monthsToDurationDaysApprox(months: number): number {
  return Math.max(1, Math.round(Math.max(1, months) * 30));
}

export function durationDaysToMonthsApprox(days: number): number {
  return Math.max(1, Math.round(Math.max(1, days) / 30));
}

/** ตรวจว่าตารางมี duration_months หรือยังใช้ duration_days อยู่ */
export async function getCustomerInventoryDurationSupport(): Promise<CustomerInventoryDurationSupport> {
  if (cache) return cache;
  try {
    const client = (
      db as unknown as {
        $client?: { execute?: (sql: string) => Promise<{ rows?: Array<Record<string, unknown>> }> };
      }
    ).$client;
    const result = await client?.execute?.('PRAGMA table_info("customer_inventories")');
    const rows = (result?.rows ?? []) as Array<Record<string, unknown>>;
    const names = new Set(rows.map((r) => String(r.name ?? "")));
    const durationMonthsColumn = names.has("duration_months");
    const durationDaysColumn = names.has("duration_days");
    cache = {
      useDurationMonthsColumn: durationMonthsColumn,
      useHybridDurationDays: durationDaysColumn && !durationMonthsColumn,
    };
    return cache;
  } catch {
    cache = {
      useDurationMonthsColumn: false,
      useHybridDurationDays: true,
    };
    return cache;
  }
}
