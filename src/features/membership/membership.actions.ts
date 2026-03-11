"use server";

import { revalidatePath } from "next/cache";
import {
  upsertMembershipPlan,
  deleteMembershipPlan as deletePlanRepo,
  createCustomerMembership,
  findMembershipPlanById,
  findActiveMembershipByCustomerId,
} from "./membership.repo";
import type { BillingType } from "./membership.repo";

export type SavePlanState = { error?: string; success?: boolean };

export async function saveMembershipPlanAction(
  _prev: SavePlanState,
  formData: FormData
): Promise<SavePlanState> {
  const idRaw = formData.get("id");
  const id = idRaw ? parseInt(String(idRaw), 10) : undefined;
  const name = (formData.get("name") as string)?.trim();
  const billingType = (formData.get("billingType") as BillingType) || "monthly";
  const price = parseFloat(String(formData.get("price") ?? "0")) || 0;
  const freeRentalDays = parseInt(String(formData.get("freeRentalDays") ?? "0"), 10) || 0;
  const discountPercent = parseFloat(String(formData.get("discountPercent") ?? "0")) || 0;
  const description = (formData.get("description") as string)?.trim() || null;
  const sortOrder = parseInt(String(formData.get("sortOrder") ?? "0"), 10) || 0;
  const isActive = formData.get("isActive") === "on";

  if (!name) return { error: "กรุณากรอกชื่อแผน" };
  if (price < 0) return { error: "ราคาต้องไม่ต่ำกว่า 0" };
  if (freeRentalDays < 0) return { error: "วันเช่าฟรีต้องไม่ต่ำกว่า 0" };
  if (discountPercent < 0 || discountPercent > 100) return { error: "ส่วนลดต้องอยู่ระหว่าง 0–100" };

  try {
    await upsertMembershipPlan({
      id,
      name,
      billingType,
      price,
      freeRentalDays,
      discountPercent,
      description: description || undefined,
      sortOrder,
      isActive,
    });
    revalidatePath("/dashboard/membership-plans");
    revalidatePath("/membership");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "เกิดข้อผิดพลาด" };
  }
}

export async function deleteMembershipPlanAction(id: number): Promise<{ error?: string }> {
  try {
    const ok = await deletePlanRepo(id);
    if (!ok) return { error: "ไม่พบแผนหรือลบไม่ได้" };
    revalidatePath("/dashboard/membership-plans");
    revalidatePath("/membership");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "เกิดข้อผิดพลาด" };
  }
}

/** หลังชำระค่าสมาชิกแล้ว เรียกบันทึกการสมัคร (เริ่มวันนี้ หมดอายุตามแผน) */
export async function activateMembershipAction(
  customerId: number,
  planId: number
): Promise<{ error?: string }> {
  try {
    const plan = await findMembershipPlanById(planId);
    if (!plan) return { error: "ไม่พบแผน" };
    const startedAt = new Date();
    const expiresAt = new Date(startedAt);
    if (plan.billingType === "monthly") {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }
    await createCustomerMembership({ customerId, planId, startedAt, expiresAt });
    revalidatePath("/dashboard/memberships");
    revalidatePath("/account/membership");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "เกิดข้อผิดพลาด" };
  }
}
