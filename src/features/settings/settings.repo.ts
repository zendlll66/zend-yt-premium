import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema/settings.schema";

/** คีย์ที่ใช้ในตาราง settings */
export const SETTING_KEYS = {
  shopName: "shop_name",
  shopAddress: "shop_address",
  shopPhone: "shop_phone",
  shopTaxId: "shop_tax_id",
  shopLogo: "shop_logo",
  shopDescription: "shop_description",
  receiptHeader: "receipt_header",
  receiptFooter: "receipt_footer",
  currency: "currency",
  timezone: "timezone",
  serviceChargePercent: "service_charge_percent",
  vatPercent: "vat_percent",
  openingHours: "opening_hours",
  theme: "theme",
} as const;

/** ค่าที่ใช้ได้สำหรับ theme (ต้องตรงกับ [data-theme] ใน globals.css) */
export const THEME_OPTIONS = ["default", "green", "amber", "blue", "rose"] as const;
export type ThemeId = (typeof THEME_OPTIONS)[number];

const DEFAULTS: Record<string, string> = {
  [SETTING_KEYS.shopName]: "",
  [SETTING_KEYS.shopAddress]: "",
  [SETTING_KEYS.shopPhone]: "",
  [SETTING_KEYS.shopTaxId]: "",
  [SETTING_KEYS.shopLogo]: "",
  [SETTING_KEYS.shopDescription]: "",
  [SETTING_KEYS.receiptHeader]: "",
  [SETTING_KEYS.receiptFooter]: "ขอบคุณที่ใช้บริการ",
  [SETTING_KEYS.currency]: "THB",
  [SETTING_KEYS.timezone]: "Asia/Bangkok",
  [SETTING_KEYS.serviceChargePercent]: "0",
  [SETTING_KEYS.vatPercent]: "7",
  [SETTING_KEYS.openingHours]: "",
  [SETTING_KEYS.theme]: "default",
};

export type ShopSettings = {
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  shopTaxId: string;
  shopLogo: string;
  shopDescription: string;
  receiptHeader: string;
  receiptFooter: string;
  currency: string;
  timezone: string;
  serviceChargePercent: string;
  vatPercent: string;
  openingHours: string;
  theme: string;
};

export async function getShopSettings(): Promise<ShopSettings> {
  const rows = await db.select().from(settings);
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    shopName: map.get(SETTING_KEYS.shopName) ?? DEFAULTS[SETTING_KEYS.shopName],
    shopAddress: map.get(SETTING_KEYS.shopAddress) ?? DEFAULTS[SETTING_KEYS.shopAddress],
    shopPhone: map.get(SETTING_KEYS.shopPhone) ?? DEFAULTS[SETTING_KEYS.shopPhone],
    shopTaxId: map.get(SETTING_KEYS.shopTaxId) ?? DEFAULTS[SETTING_KEYS.shopTaxId],
    shopLogo: map.get(SETTING_KEYS.shopLogo) ?? DEFAULTS[SETTING_KEYS.shopLogo],
    shopDescription: map.get(SETTING_KEYS.shopDescription) ?? DEFAULTS[SETTING_KEYS.shopDescription],
    receiptHeader: map.get(SETTING_KEYS.receiptHeader) ?? DEFAULTS[SETTING_KEYS.receiptHeader],
    receiptFooter: map.get(SETTING_KEYS.receiptFooter) ?? DEFAULTS[SETTING_KEYS.receiptFooter],
    currency: map.get(SETTING_KEYS.currency) ?? DEFAULTS[SETTING_KEYS.currency],
    timezone: map.get(SETTING_KEYS.timezone) ?? DEFAULTS[SETTING_KEYS.timezone],
    serviceChargePercent: map.get(SETTING_KEYS.serviceChargePercent) ?? DEFAULTS[SETTING_KEYS.serviceChargePercent],
    vatPercent: map.get(SETTING_KEYS.vatPercent) ?? DEFAULTS[SETTING_KEYS.vatPercent],
    openingHours: map.get(SETTING_KEYS.openingHours) ?? DEFAULTS[SETTING_KEYS.openingHours],
    theme: map.get(SETTING_KEYS.theme) ?? DEFAULTS[SETTING_KEYS.theme],
  };
}

export async function saveShopSettings(data: Partial<ShopSettings>): Promise<void> {
  const entries: [string, string][] = [];
  if (data.shopName !== undefined) entries.push([SETTING_KEYS.shopName, String(data.shopName)]);
  if (data.shopAddress !== undefined) entries.push([SETTING_KEYS.shopAddress, String(data.shopAddress)]);
  if (data.shopPhone !== undefined) entries.push([SETTING_KEYS.shopPhone, String(data.shopPhone)]);
  if (data.shopTaxId !== undefined) entries.push([SETTING_KEYS.shopTaxId, String(data.shopTaxId)]);
  if (data.shopLogo !== undefined) entries.push([SETTING_KEYS.shopLogo, String(data.shopLogo)]);
  if (data.shopDescription !== undefined) entries.push([SETTING_KEYS.shopDescription, String(data.shopDescription)]);
  if (data.receiptHeader !== undefined) entries.push([SETTING_KEYS.receiptHeader, String(data.receiptHeader)]);
  if (data.receiptFooter !== undefined) entries.push([SETTING_KEYS.receiptFooter, String(data.receiptFooter)]);
  if (data.currency !== undefined) entries.push([SETTING_KEYS.currency, String(data.currency)]);
  if (data.timezone !== undefined) entries.push([SETTING_KEYS.timezone, String(data.timezone)]);
  if (data.serviceChargePercent !== undefined) entries.push([SETTING_KEYS.serviceChargePercent, String(data.serviceChargePercent)]);
  if (data.vatPercent !== undefined) entries.push([SETTING_KEYS.vatPercent, String(data.vatPercent)]);
  if (data.openingHours !== undefined) entries.push([SETTING_KEYS.openingHours, String(data.openingHours)]);
  if (data.theme !== undefined) entries.push([SETTING_KEYS.theme, String(data.theme)]);

  for (const [key, value] of entries) {
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } });
  }
}
