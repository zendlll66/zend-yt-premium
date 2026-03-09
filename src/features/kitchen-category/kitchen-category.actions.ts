"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  findKitchenCategoryById,
  createKitchenCategory,
  updateKitchenCategory,
  deleteKitchenCategoryById,
} from "./kitchen-category.repo";

export type CreateKitchenCategoryState = { error?: string };
export type UpdateKitchenCategoryState = { error?: string };

export async function createKitchenCategoryAction(
  _prev: CreateKitchenCategoryState,
  formData: FormData
): Promise<CreateKitchenCategoryState> {
  const name = (formData.get("name") as string)?.trim() ?? "";
  if (!name) return { error: "กรุณากรอกชื่อ Station" };

  const row = await createKitchenCategory({ name });
  if (!row) return { error: "สร้าง Station ไม่สำเร็จ" };

  revalidatePath("/dashboard/stations");
  revalidatePath("/dashboard/kitchen");
  redirect("/dashboard/stations");
}

export async function updateKitchenCategoryAction(
  _prev: UpdateKitchenCategoryState,
  formData: FormData
): Promise<UpdateKitchenCategoryState> {
  const id = parseInt((formData.get("id") as string) ?? "0", 10);
  const name = (formData.get("name") as string)?.trim() ?? "";
  if (!id || !name) return { error: "กรุณากรอกชื่อ Station" };

  const existing = await findKitchenCategoryById(id);
  if (!existing) return { error: "ไม่พบ Station" };

  const row = await updateKitchenCategory(id, { name });
  if (!row) return { error: "อัปเดตไม่สำเร็จ" };

  revalidatePath("/dashboard/stations");
  revalidatePath("/dashboard/kitchen");
  redirect("/dashboard/stations");
}

export async function deleteKitchenCategoryAction(id: number): Promise<{ error?: string }> {
  const existing = await findKitchenCategoryById(id);
  if (!existing) return { error: "ไม่พบ Station" };

  const ok = await deleteKitchenCategoryById(id);
  revalidatePath("/dashboard/stations");
  revalidatePath("/dashboard/kitchen");
  revalidatePath("/dashboard/products");
  if (!ok) return { error: "ลบไม่สำเร็จ" };
  return {};
}
