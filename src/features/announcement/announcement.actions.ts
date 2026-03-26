"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-server";
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "./announcement.repo";

export async function createAnnouncementAction(
  _prev: Record<string, unknown>,
  formData: FormData
): Promise<{ error?: string }> {
  const admin = await getSessionUser();
  if (!admin) return { error: "Unauthorized" };

  const title = formData.get("title")?.toString().trim() ?? "";
  const content = formData.get("content")?.toString() ?? "";
  const isEnabled = formData.get("isEnabled") !== "0";
  const sortOrder = parseInt(formData.get("sortOrder")?.toString() ?? "0", 10) || 0;
  const startsAtRaw = formData.get("startsAt")?.toString() ?? "";
  const endsAtRaw = formData.get("endsAt")?.toString() ?? "";

  if (!title) return { error: "กรุณากรอกชื่อประกาศ" };
  if (!content.trim()) return { error: "กรุณากรอกเนื้อหา" };

  await createAnnouncement({
    title,
    content,
    isEnabled,
    sortOrder,
    startsAt: startsAtRaw ? new Date(startsAtRaw) : null,
    endsAt: endsAtRaw ? new Date(endsAtRaw) : null,
  });

  revalidatePath("/dashboard/announcements");
  redirect("/dashboard/announcements");
}

export async function updateAnnouncementAction(
  _prev: Record<string, unknown>,
  formData: FormData
): Promise<{ error?: string }> {
  const admin = await getSessionUser();
  if (!admin) return { error: "Unauthorized" };

  const id = parseInt(formData.get("id")?.toString() ?? "", 10);
  const title = formData.get("title")?.toString().trim() ?? "";
  const content = formData.get("content")?.toString() ?? "";
  const isEnabled = formData.get("isEnabled") !== "0";
  const sortOrder = parseInt(formData.get("sortOrder")?.toString() ?? "0", 10) || 0;
  const startsAtRaw = formData.get("startsAt")?.toString() ?? "";
  const endsAtRaw = formData.get("endsAt")?.toString() ?? "";

  if (!id) return { error: "ไม่พบข้อมูล" };
  if (!title) return { error: "กรุณากรอกชื่อประกาศ" };

  await updateAnnouncement(id, {
    title,
    content,
    isEnabled,
    sortOrder,
    startsAt: startsAtRaw ? new Date(startsAtRaw) : null,
    endsAt: endsAtRaw ? new Date(endsAtRaw) : null,
  });

  revalidatePath("/dashboard/announcements");
  redirect("/dashboard/announcements");
}

export async function deleteAnnouncementAction(
  _prev: Record<string, unknown>,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const admin = await getSessionUser();
  if (!admin) return { error: "Unauthorized" };

  const id = parseInt(formData.get("id")?.toString() ?? "", 10);
  if (!id) return { error: "ไม่พบข้อมูล" };

  await deleteAnnouncement(id);
  revalidatePath("/dashboard/announcements");
  return { success: true };
}

export async function toggleAnnouncementAction(
  _prev: Record<string, unknown>,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const admin = await getSessionUser();
  if (!admin) return { error: "Unauthorized" };

  const id = parseInt(formData.get("id")?.toString() ?? "", 10);
  const isEnabled = formData.get("isEnabled") === "1";
  if (!id) return { error: "ไม่พบข้อมูล" };

  await updateAnnouncement(id, { isEnabled });
  revalidatePath("/dashboard/announcements");
  return { success: true };
}
