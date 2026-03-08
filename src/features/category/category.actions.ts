"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  findCategoryById,
  createCategory,
  updateCategory,
  deleteCategoryById,
} from "./category.repo";

export type CreateCategoryState = { error?: string };
export type UpdateCategoryState = { error?: string };

export async function createCategoryAction(
  _prev: CreateCategoryState,
  formData: FormData
): Promise<CreateCategoryState> {
  const name = (formData.get("name") as string)?.trim() ?? "";
  if (!name) return { error: "กรุณากรอกชื่อหมวดหมู่" };

  const category = await createCategory({ name });
  if (!category) return { error: "สร้างหมวดหมู่ไม่สำเร็จ" };

  revalidatePath("/dashboard/categories");
  redirect("/dashboard/categories");
}

export async function updateCategoryAction(
  _prev: UpdateCategoryState,
  formData: FormData
): Promise<UpdateCategoryState> {
  const id = parseInt((formData.get("id") as string) ?? "0", 10);
  const name = (formData.get("name") as string)?.trim() ?? "";
  if (!id || !name) return { error: "กรุณากรอกชื่อหมวดหมู่" };

  const existing = await findCategoryById(id);
  if (!existing) return { error: "ไม่พบหมวดหมู่" };

  const category = await updateCategory(id, { name });
  if (!category) return { error: "อัปเดตไม่สำเร็จ" };

  revalidatePath("/dashboard/categories");
  redirect("/dashboard/categories");
}

export async function deleteCategoryAction(id: number): Promise<{ error?: string }> {
  const existing = await findCategoryById(id);
  if (!existing) return { error: "ไม่พบหมวดหมู่" };

  const ok = await deleteCategoryById(id);
  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/products");
  if (!ok) return { error: "ลบไม่สำเร็จ" };
  return {};
}
