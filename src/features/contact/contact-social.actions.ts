"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth-server";
import {
  createContactSocial,
  updateContactSocial,
  deleteContactSocial,
} from "./contact-social.repo";

export async function createContactSocialAction(
  _prev: Record<string, unknown>,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const admin = await getSessionUser();
  if (!admin) return { error: "Unauthorized" };

  const label = formData.get("label")?.toString().trim() ?? "";
  const platform = formData.get("platform")?.toString() ?? "";
  const url = formData.get("url")?.toString().trim() ?? "";
  const sortOrder = parseInt(formData.get("sortOrder")?.toString() ?? "0", 10) || 0;

  if (!label) return { error: "กรุณากรอกชื่อ" };
  if (!url) return { error: "กรุณากรอก URL หรือเบอร์ติดต่อ" };

  await createContactSocial({ label, platform, url, sortOrder });
  revalidatePath("/dashboard/settings/contact");
  revalidatePath("/contact");
  return { success: true };
}

export async function updateContactSocialAction(
  _prev: Record<string, unknown>,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const admin = await getSessionUser();
  if (!admin) return { error: "Unauthorized" };

  const id = parseInt(formData.get("id")?.toString() ?? "", 10);
  const label = formData.get("label")?.toString().trim() ?? "";
  const platform = formData.get("platform")?.toString() ?? "";
  const url = formData.get("url")?.toString().trim() ?? "";
  const isEnabled = formData.get("isEnabled") === "1";
  const sortOrder = parseInt(formData.get("sortOrder")?.toString() ?? "0", 10) || 0;

  if (!id) return { error: "ไม่พบข้อมูล" };
  if (!label) return { error: "กรุณากรอกชื่อ" };

  await updateContactSocial(id, { label, platform, url, isEnabled, sortOrder });
  revalidatePath("/dashboard/settings/contact");
  revalidatePath("/contact");
  return { success: true };
}

export async function deleteContactSocialAction(
  _prev: Record<string, unknown>,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const admin = await getSessionUser();
  if (!admin) return { error: "Unauthorized" };

  const id = parseInt(formData.get("id")?.toString() ?? "", 10);
  if (!id) return { error: "ไม่พบข้อมูล" };

  await deleteContactSocial(id);
  revalidatePath("/dashboard/settings/contact");
  revalidatePath("/contact");
  return { success: true };
}
