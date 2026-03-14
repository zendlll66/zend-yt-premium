import "dotenv/config";
import { db } from "@/db";
import { settings } from "@/db/schema/settings.schema";
import { SETTING_KEYS } from "@/features/settings/settings.repo";

const DEFAULTS: Record<string, string> = {
  [SETTING_KEYS.shopName]: "ZEnd Premium Shop",
  [SETTING_KEYS.shopAddress]: "",
  [SETTING_KEYS.shopPhone]: "",
  [SETTING_KEYS.shopTaxId]: "",
  [SETTING_KEYS.shopLogo]: "",
  [SETTING_KEYS.shopDescription]: "ร้านขายแพ็กเกจ YouTube Premium, Netflix, Disney+, Spotify",
  [SETTING_KEYS.receiptHeader]: "",
  [SETTING_KEYS.receiptFooter]: "ขอบคุณที่ใช้บริการ",
  [SETTING_KEYS.currency]: "THB",
  [SETTING_KEYS.timezone]: "Asia/Bangkok",
  [SETTING_KEYS.serviceChargePercent]: "0",
  [SETTING_KEYS.vatPercent]: "7",
  [SETTING_KEYS.openingHours]: "",
  [SETTING_KEYS.theme]: "default",
  [SETTING_KEYS.deliveryEnabled]: "0",
  [SETTING_KEYS.paymentStripeEnabled]: "1",
  [SETTING_KEYS.paymentBankEnabled]: "0",
  [SETTING_KEYS.bankName]: "",
  [SETTING_KEYS.bankAccountName]: "",
  [SETTING_KEYS.bankAccountNumber]: "",
  [SETTING_KEYS.bankPromptpayId]: "",
};

export async function seedSettings(): Promise<void> {
  console.log("Seeding settings...");
  let added = 0;
  for (const [key, value] of Object.entries(DEFAULTS)) {
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } });
    added++;
  }
  console.log("Seed settings done. Keys:", added);
}

const isMain = process.argv[1]?.replace(/\\/g, "/").endsWith("seed-settings.ts");
if (isMain) {
  seedSettings().catch((e) => {
    console.error("Seed settings failed:", e);
    process.exit(1);
  });
}
