"use server";

import { revalidatePath } from "next/cache";
import { saveShopSettings } from "./settings.repo";
import type { ShopSettings } from "./settings.repo";

export type SaveSettingsState = { error?: string; success?: boolean };

export async function saveSettingsAction(
  _prev: SaveSettingsState,
  formData: FormData
): Promise<SaveSettingsState> {
  const data: Partial<ShopSettings> = {
    shopName: (formData.get("shopName") as string)?.trim() ?? "",
    shopAddress: (formData.get("shopAddress") as string)?.trim() ?? "",
    shopPhone: (formData.get("shopPhone") as string)?.trim() ?? "",
    shopTaxId: (formData.get("shopTaxId") as string)?.trim() ?? "",
    shopLogo: (formData.get("shopLogo") as string)?.trim() ?? "",
    shopDescription: (formData.get("shopDescription") as string)?.trim() ?? "",
    receiptHeader: (formData.get("receiptHeader") as string)?.trim() ?? "",
    receiptFooter: (formData.get("receiptFooter") as string)?.trim() ?? "",
    currency: (formData.get("currency") as string)?.trim() || "THB",
    timezone: (formData.get("timezone") as string)?.trim() || "Asia/Bangkok",
    serviceChargePercent: (formData.get("serviceChargePercent") as string)?.trim() ?? "0",
    vatPercent: (formData.get("vatPercent") as string)?.trim() ?? "7",
    openingHours: (formData.get("openingHours") as string)?.trim() ?? "",
    theme: (formData.get("theme") as string)?.trim() || "default",
    deliveryEnabled: formData.get("deliveryEnabled") === "on" ? "1" : "0",
    paymentStripeEnabled: formData.get("paymentStripeEnabled") === "on" ? "1" : "0",
    paymentBankEnabled: formData.get("paymentBankEnabled") === "on" ? "1" : "0",
    bankName: (formData.get("bankName") as string)?.trim() ?? "",
    bankAccountName: (formData.get("bankAccountName") as string)?.trim() ?? "",
    bankAccountNumber: (formData.get("bankAccountNumber") as string)?.trim() ?? "",
    bankPromptpayId: (formData.get("bankPromptpayId") as string)?.trim() ?? "",
  };

  await saveShopSettings(data);
  revalidatePath("/dashboard/settings");
  return { success: true };
}
