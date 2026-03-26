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
  /** เปิดบริการส่ง (1 = เปิด ให้เลือกรับที่ร้านหรือส่งได้, 0 = รับที่ร้านอย่างเดียว) */
  deliveryEnabled: "delivery_enabled",
  /** ช่องทางชำระเงิน */
  paymentStripeEnabled: "payment_stripe_enabled",
  paymentBankEnabled: "payment_bank_enabled",
  bankName: "bank_name",
  bankAccountName: "bank_account_name",
  bankAccountNumber: "bank_account_number",
  bankPromptpayId: "bank_promptpay_id",
  inventoryExpiryWarningDays: "inventory_expiry_warning_days",
  inventoryExpiryWarningMessage: "inventory_expiry_warning_message",
  inventoryExpiryWarningMode: "inventory_expiry_warning_mode",
  inventoryExpiredMessage: "inventory_expired_message",
  inventoryExpiredMode: "inventory_expired_mode",
  inventoryExpiredRepeatDays: "inventory_expired_repeat_days",
  /** "1" = เปิดโหมดปิดปรับปรุง, "0" = ปกติ */
  maintenanceMode: "maintenance_mode",
  /** ข้อความที่แสดงเมื่อปิดปรับปรุง */
  maintenanceMessage: "maintenance_message",
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
  [SETTING_KEYS.deliveryEnabled]: "1",
  [SETTING_KEYS.paymentStripeEnabled]: "1",
  [SETTING_KEYS.paymentBankEnabled]: "0",
  [SETTING_KEYS.bankName]: "",
  [SETTING_KEYS.bankAccountName]: "",
  [SETTING_KEYS.bankAccountNumber]: "",
  [SETTING_KEYS.bankPromptpayId]: "",
  [SETTING_KEYS.inventoryExpiryWarningDays]: "5",
  [SETTING_KEYS.inventoryExpiryWarningMessage]:
    "รายการ {{title}} ใกล้หมดอายุแล้ว (ออเดอร์ {{orderNumber}}) จะหมดอายุวันที่ {{expiresAt}}",
  [SETTING_KEYS.inventoryExpiryWarningMode]: "once",
  [SETTING_KEYS.inventoryExpiredMessage]:
    "รายการ {{title}} (ออเดอร์ {{orderNumber}}) หมดอายุแล้วตั้งแต่วันที่ {{expiresAt}}",
  [SETTING_KEYS.inventoryExpiredMode]: "once",
  [SETTING_KEYS.inventoryExpiredRepeatDays]: "3",
  [SETTING_KEYS.maintenanceMode]: "0",
  [SETTING_KEYS.maintenanceMessage]: "ขณะนี้ระบบอยู่ระหว่างปิดปรับปรุง กรุณากลับมาใหม่ภายหลัง",
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
  /** "1" = เปิดบริการส่ง, "0" = รับที่ร้านอย่างเดียว */
  deliveryEnabled: string;
  /** "1" = เปิดจ่ายผ่าน Stripe, "0" = ปิด */
  paymentStripeEnabled: string;
  /** "1" = เปิดจ่ายผ่านโอนธนาคาร/QR, "0" = ปิด */
  paymentBankEnabled: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  /** พร้อมเพย์สำหรับสร้าง QR แบบระบุยอด */
  bankPromptpayId: string;
  /** แสดงคำเตือน order ใกล้หมดอายุก่อนหมดกี่วัน (inventory) */
  inventoryExpiryWarningDays: string;
  /** ข้อความแจ้งเตือนใกล้หมดอายุ (template) */
  inventoryExpiryWarningMessage: string;
  /** โหมดส่งแจ้งเตือนใกล้หมดอายุ: once | daily */
  inventoryExpiryWarningMode: string;
  /** ข้อความแจ้งเตือนหมดอายุแล้ว (template) */
  inventoryExpiredMessage: string;
  /** โหมดส่งแจ้งเตือนหมดอายุ: once | daily */
  inventoryExpiredMode: string;
  /** จำนวนวันหลังหมดอายุที่จะส่งซ้ำ (ใช้กับโหมด daily) */
  inventoryExpiredRepeatDays: string;
  /** "1" = ปิดปรับปรุง, "0" = ปกติ */
  maintenanceMode: string;
  maintenanceMessage: string;
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
    deliveryEnabled: map.get(SETTING_KEYS.deliveryEnabled) ?? DEFAULTS[SETTING_KEYS.deliveryEnabled],
    paymentStripeEnabled:
      map.get(SETTING_KEYS.paymentStripeEnabled) ?? DEFAULTS[SETTING_KEYS.paymentStripeEnabled],
    paymentBankEnabled:
      map.get(SETTING_KEYS.paymentBankEnabled) ?? DEFAULTS[SETTING_KEYS.paymentBankEnabled],
    bankName: map.get(SETTING_KEYS.bankName) ?? DEFAULTS[SETTING_KEYS.bankName],
    bankAccountName: map.get(SETTING_KEYS.bankAccountName) ?? DEFAULTS[SETTING_KEYS.bankAccountName],
    bankAccountNumber:
      map.get(SETTING_KEYS.bankAccountNumber) ?? DEFAULTS[SETTING_KEYS.bankAccountNumber],
    bankPromptpayId: map.get(SETTING_KEYS.bankPromptpayId) ?? DEFAULTS[SETTING_KEYS.bankPromptpayId],
    inventoryExpiryWarningDays:
      map.get(SETTING_KEYS.inventoryExpiryWarningDays) ??
      DEFAULTS[SETTING_KEYS.inventoryExpiryWarningDays],
    inventoryExpiryWarningMessage:
      map.get(SETTING_KEYS.inventoryExpiryWarningMessage) ??
      DEFAULTS[SETTING_KEYS.inventoryExpiryWarningMessage],
    inventoryExpiryWarningMode:
      map.get(SETTING_KEYS.inventoryExpiryWarningMode) ??
      DEFAULTS[SETTING_KEYS.inventoryExpiryWarningMode],
    inventoryExpiredMessage:
      map.get(SETTING_KEYS.inventoryExpiredMessage) ?? DEFAULTS[SETTING_KEYS.inventoryExpiredMessage],
    inventoryExpiredMode:
      map.get(SETTING_KEYS.inventoryExpiredMode) ?? DEFAULTS[SETTING_KEYS.inventoryExpiredMode],
    inventoryExpiredRepeatDays:
      map.get(SETTING_KEYS.inventoryExpiredRepeatDays) ??
      DEFAULTS[SETTING_KEYS.inventoryExpiredRepeatDays],
    maintenanceMode:
      map.get(SETTING_KEYS.maintenanceMode) ?? DEFAULTS[SETTING_KEYS.maintenanceMode],
    maintenanceMessage:
      map.get(SETTING_KEYS.maintenanceMessage) ?? DEFAULTS[SETTING_KEYS.maintenanceMessage],
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
  if (data.deliveryEnabled !== undefined) entries.push([SETTING_KEYS.deliveryEnabled, String(data.deliveryEnabled)]);
  if (data.paymentStripeEnabled !== undefined)
    entries.push([SETTING_KEYS.paymentStripeEnabled, String(data.paymentStripeEnabled)]);
  if (data.paymentBankEnabled !== undefined)
    entries.push([SETTING_KEYS.paymentBankEnabled, String(data.paymentBankEnabled)]);
  if (data.bankName !== undefined) entries.push([SETTING_KEYS.bankName, String(data.bankName)]);
  if (data.bankAccountName !== undefined)
    entries.push([SETTING_KEYS.bankAccountName, String(data.bankAccountName)]);
  if (data.bankAccountNumber !== undefined)
    entries.push([SETTING_KEYS.bankAccountNumber, String(data.bankAccountNumber)]);
  if (data.bankPromptpayId !== undefined)
    entries.push([SETTING_KEYS.bankPromptpayId, String(data.bankPromptpayId)]);
  if (data.inventoryExpiryWarningDays !== undefined)
    entries.push([
      SETTING_KEYS.inventoryExpiryWarningDays,
      String(data.inventoryExpiryWarningDays),
    ]);
  if (data.inventoryExpiryWarningMessage !== undefined)
    entries.push([
      SETTING_KEYS.inventoryExpiryWarningMessage,
      String(data.inventoryExpiryWarningMessage),
    ]);
  if (data.inventoryExpiryWarningMode !== undefined)
    entries.push([
      SETTING_KEYS.inventoryExpiryWarningMode,
      String(data.inventoryExpiryWarningMode),
    ]);
  if (data.inventoryExpiredMessage !== undefined)
    entries.push([SETTING_KEYS.inventoryExpiredMessage, String(data.inventoryExpiredMessage)]);
  if (data.inventoryExpiredMode !== undefined)
    entries.push([SETTING_KEYS.inventoryExpiredMode, String(data.inventoryExpiredMode)]);
  if (data.inventoryExpiredRepeatDays !== undefined)
    entries.push([
      SETTING_KEYS.inventoryExpiredRepeatDays,
      String(data.inventoryExpiredRepeatDays),
    ]);
  if (data.maintenanceMode !== undefined)
    entries.push([SETTING_KEYS.maintenanceMode, String(data.maintenanceMode)]);
  if (data.maintenanceMessage !== undefined)
    entries.push([SETTING_KEYS.maintenanceMessage, String(data.maintenanceMessage)]);

  for (const [key, value] of entries) {
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } });
  }
}
