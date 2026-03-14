"use server";

import { revalidatePath } from "next/cache";
import {
  getStockTypeDescriptions,
  saveStockTypeDescription,
  type StockTypeDescription,
} from "./stock-type-descriptions.repo";
import type { ProductStockType } from "@/db/schema/product.schema";

export async function getStockTypeDescriptionsAction(): Promise<StockTypeDescription[]> {
  return getStockTypeDescriptions();
}

export type SaveStockTypeDescriptionState = { error?: string; success?: boolean };

export async function saveStockTypeDescriptionAction(
  _prev: SaveStockTypeDescriptionState,
  formData: FormData
): Promise<SaveStockTypeDescriptionState> {
  const slug = (formData.get("slug") as ProductStockType) ?? "individual";
  if (!["individual", "family", "invite", "customer_account"].includes(slug)) {
    return { error: "ประเภทไม่ถูกต้อง" };
  }
  const name = (formData.get("name") as string)?.trim() ?? "";
  const description = (formData.get("description") as string) ?? "";
  const imageKey = (formData.get("imageKey") as string)?.trim() ?? "";

  await saveStockTypeDescription(slug, { name, description, imageKey });
  revalidatePath("/dashboard/stock-types");
  return { success: true };
}
