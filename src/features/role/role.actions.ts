"use server";

import { revalidatePath } from "next/cache";
import {
  createRole,
  updateRole,
  deleteRole as deleteRoleRepo,
  findRoleBySlug,
} from "./role.repo";

export async function createRoleAction(formData: FormData) {
  const slug = (formData.get("slug") as string)?.trim()?.toLowerCase()?.replace(/\s+/g, "_");
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  if (!slug || !name) return { error: "กรุณากรอก slug และชื่อบทบาท" };
  const existing = await findRoleBySlug(slug);
  if (existing) return { error: "slug นี้มีอยู่แล้ว" };
  const role = await createRole({ slug, name, description });
  if (!role) return { error: "สร้างบทบาทไม่สำเร็จ" };
  revalidatePath("/dashboard/roles");
  revalidatePath("/dashboard/roles/add");
  revalidatePath("/dashboard/user-list");
  revalidatePath("/dashboard/permissions");
  return { ok: true };
}

export async function updateRoleAction(
  id: number,
  formData: FormData
) {
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const slugRaw = (formData.get("slug") as string)?.trim();
  const slug = slugRaw ? slugRaw.toLowerCase().replace(/\s+/g, "_") : undefined;
  if (name != null && !name) return { error: "ชื่อบทบาทต้องไม่ว่าง" };
  const role = await updateRole(id, { slug, name, description });
  if (!role) return { error: "อัปเดตไม่สำเร็จ" };
  revalidatePath("/dashboard/roles");
  revalidatePath(`/dashboard/roles/${id}/edit`);
  revalidatePath("/dashboard/user-list");
  revalidatePath("/dashboard/permissions");
  return { ok: true };
}

export async function deleteRoleAction(id: number) {
  const result = await deleteRoleRepo(id);
  if (!result.ok) return { error: result.error };
  revalidatePath("/dashboard/roles");
  revalidatePath("/dashboard/user-list");
  revalidatePath("/dashboard/permissions");
  return { ok: true };
}
