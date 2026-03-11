"use server";

import { revalidatePath } from "next/cache";
import {
  upsertPromotion,
  deletePromotion,
  findPromotionById,
} from "./promotion.repo";

export type SavePromotionState = { error?: string; success?: boolean };

export async function savePromotionAction(
  _prev: SavePromotionState,
  formData: FormData
): Promise<SavePromotionState> {
  const idRaw = formData.get("id");
  const id = idRaw ? parseInt(String(idRaw), 10) : undefined;
  const name = (formData.get("name") as string)?.trim();
  const discountPercent = parseFloat(String(formData.get("discountPercent") ?? "0")) || 0;
  const startAtRaw = formData.get("startAt") as string;
  const endAtRaw = formData.get("endAt") as string;
  const productIdsAll = formData.getAll("productIds");
  const productIds = productIdsAll
    .map((s) => parseInt(String(s), 10))
    .filter(Number.isFinite);

  if (!name) return { error: "กรุณากรอกชื่อโปร" };
  if (discountPercent <= 0 || discountPercent > 100)
    return { error: "ส่วนลดต้องอยู่ระหว่าง 1–100%" };
  if (!startAtRaw) return { error: "กรุณาเลือกวันเริ่มต้น" };
  if (!endAtRaw) return { error: "กรุณาเลือกวันสิ้นสุด" };
  const startAt =
    startAtRaw.length <= 10
      ? new Date(startAtRaw + "T00:00:00")
      : new Date(startAtRaw);
  const endAt =
    endAtRaw.length <= 10
      ? new Date(endAtRaw + "T23:59:59")
      : new Date(endAtRaw);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()))
    return { error: "รูปแบบวันไม่ถูกต้อง" };
  if (endAt < startAt) return { error: "วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น" };
  if (productIds.length === 0) return { error: "กรุณาเลือกสินค้าอย่างน้อย 1 รายการ" };

  try {
    await upsertPromotion({
      id,
      name,
      discountPercent,
      startAt,
      endAt,
      productIds,
    });
    revalidatePath("/dashboard/promotions");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "เกิดข้อผิดพลาด" };
  }
}

export async function deletePromotionAction(id: number): Promise<{ error?: string }> {
  try {
    const ok = await deletePromotion(id);
    if (!ok) return { error: "ไม่พบโปรหรือลบไม่ได้" };
    revalidatePath("/dashboard/promotions");
    revalidatePath("/");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "เกิดข้อผิดพลาด" };
  }
}
