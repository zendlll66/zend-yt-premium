"use server";

import { uploadToR2, deleteFromR2, getR2PublicUrl } from "@/lib/r2";

export type UploadImageResult = { key?: string; error?: string };

export async function uploadImageAction(
  formData: FormData
): Promise<UploadImageResult> {
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string)?.trim() || "uploads";

  if (!file || !(file instanceof File) || file.size === 0) {
    return { error: "ไม่มีไฟล์" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = await uploadToR2(
    folder,
    buffer,
    file.type || "application/octet-stream",
    file.name
  );

  if (!key) return { error: "อัปโหลดไม่สำเร็จ" };
  return { key };
}

export type DeleteImageResult = { ok?: boolean; error?: string };

export async function deleteImageAction(key: string): Promise<DeleteImageResult> {
  if (!key?.trim()) return { ok: true };
  const ok = await deleteFromR2(key);
  return ok ? { ok: true } : { error: "ลบรูปไม่สำเร็จ" };
}

export async function getImageUrl(key: string | null | undefined): Promise<string> {
  if (!key?.trim()) return "";
  return getR2PublicUrl(key);
}
