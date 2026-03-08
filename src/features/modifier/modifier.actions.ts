"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  findModifierGroupById,
  findModifierById,
  createModifierGroup,
  updateModifierGroup,
  deleteModifierGroupById,
  createModifier,
  updateModifier,
  deleteModifierById,
  setProductModifierGroups,
} from "./modifier.repo";

// ---------- Modifier Groups ----------

export type CreateGroupState = { error?: string };
export type UpdateGroupState = { error?: string };

export async function createModifierGroupAction(
  _prev: CreateGroupState,
  formData: FormData
): Promise<CreateGroupState> {
  const name = (formData.get("name") as string)?.trim() ?? "";
  const required = formData.get("required") === "1";
  if (!name) return { error: "กรุณากรอกชื่อกลุ่มตัวเลือก" };

  const group = await createModifierGroup({ name, required });
  if (!group) return { error: "สร้างกลุ่มไม่สำเร็จ" };

  revalidatePath("/dashboard/modifiers");
  redirect("/dashboard/modifiers");
}

export async function updateModifierGroupAction(
  _prev: UpdateGroupState,
  formData: FormData
): Promise<UpdateGroupState> {
  const id = parseInt((formData.get("id") as string) ?? "0", 10);
  const name = (formData.get("name") as string)?.trim() ?? "";
  const required = formData.get("required") === "1";
  if (!id || !name) return { error: "กรุณากรอกชื่อกลุ่มตัวเลือก" };

  const existing = await findModifierGroupById(id);
  if (!existing) return { error: "ไม่พบกลุ่มตัวเลือก" };

  const group = await updateModifierGroup(id, { name, required });
  if (!group) return { error: "อัปเดตไม่สำเร็จ" };

  revalidatePath("/dashboard/modifiers");
  redirect("/dashboard/modifiers");
}

export async function deleteModifierGroupAction(id: number): Promise<{ error?: string }> {
  const existing = await findModifierGroupById(id);
  if (!existing) return { error: "ไม่พบกลุ่มตัวเลือก" };

  const ok = await deleteModifierGroupById(id);
  revalidatePath("/dashboard/modifiers");
  revalidatePath("/dashboard/products");
  if (!ok) return { error: "ลบไม่สำเร็จ" };
  return {};
}

// ---------- Modifiers (options) ----------

export type CreateModifierState = { error?: string };
export type UpdateModifierState = { error?: string };

function parseNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function createModifierAction(formData: FormData): Promise<CreateModifierState> {
  const groupId = parseNum(formData.get("groupId")) ?? 0;
  const name = (formData.get("name") as string)?.trim() ?? "";
  const price = parseNum(formData.get("price")) ?? 0;
  if (!groupId) return { error: "ไม่พบกลุ่มตัวเลือก" };
  if (!name) return { error: "กรุณากรอกชื่อตัวเลือก" };

  const mod = await createModifier({ groupId, name, price });
  if (!mod) return { error: "สร้างตัวเลือกไม่สำเร็จ" };

  revalidatePath("/dashboard/modifiers");
  revalidatePath(`/dashboard/modifiers/${groupId}/edit`);
  return {};
}

export async function updateModifierAction(
  id: number,
  groupId: number,
  formData: FormData
): Promise<UpdateModifierState> {
  const name = (formData.get("name") as string)?.trim() ?? "";
  const price = parseNum(formData.get("price")) ?? 0;
  const existing = await findModifierById(id);
  if (!existing) return { error: "ไม่พบตัวเลือก" };

  await updateModifier(id, { name, price });
  revalidatePath("/dashboard/modifiers");
  revalidatePath(`/dashboard/modifiers/${groupId}/edit`);
  return {};
}

export async function deleteModifierAction(id: number): Promise<{ error?: string }> {
  const existing = await findModifierById(id);
  if (!existing) return { error: "ไม่พบตัวเลือก" };

  const ok = await deleteModifierById(id);
  revalidatePath("/dashboard/modifiers");
  if (!ok) return { error: "ลบไม่สำเร็จ" };
  return {};
}

// ---------- Product-Modifier mapping ----------

export async function saveProductModifiersAction(
  productId: number,
  modifierGroupIds: number[]
) {
  await setProductModifierGroups(productId, modifierGroupIds);
  revalidatePath("/dashboard/products");
  revalidatePath(`/dashboard/products/${productId}/edit`);
}
