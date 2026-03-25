"use server";

import { revalidatePath } from "next/cache";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { getSessionUser } from "@/lib/auth-server";
import { createAuditLog } from "@/features/audit/audit.repo";
import {
  validateCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCouponById,
  type CouponRow,
} from "./coupon.repo";
import type { CouponDiscountType } from "@/db/schema/coupon.schema";

/** ตรวจสอบและคำนวณส่วนลด coupon (เรียกจากหน้า cart) */
export async function validateCouponAction(
  code: string,
  orderAmount: number
): Promise<{ ok: boolean; discountAmount?: number; couponId?: number; error?: string; couponCode?: string }> {
  const customer = await getCustomerSession();
  if (!customer) return { ok: false, error: "กรุณาเข้าสู่ระบบ" };
  if (!code?.trim()) return { ok: false, error: "กรุณากรอกรหัส coupon" };

  const result = await validateCoupon(code, customer.id, orderAmount);
  if (!result.ok) return { ok: false, error: result.error };

  return {
    ok: true,
    discountAmount: result.discountAmount,
    couponId: result.coupon.id,
    couponCode: result.coupon.code,
  };
}

// ---- Admin Actions ----

export type SaveCouponState = { success?: boolean; error?: string; id?: number };

export async function saveCouponAction(
  _prev: SaveCouponState,
  formData: FormData
): Promise<SaveCouponState> {
  const user = await getSessionUser();
  if (!user) return { error: "ไม่มีสิทธิ์" };

  const id = formData.get("id") ? parseInt(formData.get("id") as string, 10) : null;
  const code = (formData.get("code") as string)?.trim().toUpperCase();
  const name = (formData.get("name") as string)?.trim();
  const discountType = (formData.get("discountType") as string) as CouponDiscountType;
  const discountValue = parseFloat(formData.get("discountValue") as string);
  const minOrderAmount = parseFloat((formData.get("minOrderAmount") as string) || "0") || 0;
  const maxUsesRaw = (formData.get("maxUses") as string)?.trim();
  const maxUses = maxUsesRaw ? parseInt(maxUsesRaw, 10) : null;
  const expiresAtRaw = (formData.get("expiresAt") as string)?.trim();
  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null;
  const isActive = formData.get("isActive") === "1";
  const customerIdRaw = (formData.get("customerId") as string)?.trim();
  const customerId = customerIdRaw ? parseInt(customerIdRaw, 10) : null;

  if (!code) return { error: "กรุณากรอกรหัส coupon" };
  if (!name) return { error: "กรุณากรอกชื่อ" };
  if (!["percent", "fixed"].includes(discountType)) return { error: "ประเภทส่วนลดไม่ถูกต้อง" };
  if (!Number.isFinite(discountValue) || discountValue <= 0) return { error: "มูลค่าส่วนลดไม่ถูกต้อง" };
  if (discountType === "percent" && discountValue > 100) return { error: "ส่วนลด % ต้องไม่เกิน 100" };

  if (id) {
    const existing = await getCouponById(id);
    if (!existing) return { error: "ไม่พบ coupon" };
    await updateCoupon(id, { code, name, discountType, discountValue, minOrderAmount, maxUses, expiresAt, isActive, customerId });
    await createAuditLog({
      adminUserId: user.id,
      action: "coupon.update",
      entityType: "coupon",
      entityId: String(id),
      details: `แก้ไข coupon ${code}`,
    });
    revalidatePath("/dashboard/coupons");
    return { success: true, id };
  } else {
    const coupon = await createCoupon({ code, name, discountType, discountValue, minOrderAmount, maxUses, expiresAt, isActive, customerId });
    await createAuditLog({
      adminUserId: user.id,
      action: "coupon.create",
      entityType: "coupon",
      entityId: String(coupon.id),
      details: `สร้าง coupon ${code}`,
    });
    revalidatePath("/dashboard/coupons");
    return { success: true, id: coupon.id };
  }
}

export async function deleteCouponAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) return;
  const id = parseInt(formData.get("id") as string, 10);
  if (!Number.isFinite(id)) return;
  const existing = await getCouponById(id);
  if (!existing) return;
  await deleteCoupon(id);
  await createAuditLog({
    adminUserId: user.id,
    action: "coupon.delete",
    entityType: "coupon",
    entityId: String(id),
    details: `ลบ coupon ${existing.code}`,
  });
  revalidatePath("/dashboard/coupons");
}

export async function toggleCouponActiveAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) return;
  const id = parseInt(formData.get("id") as string, 10);
  const isActive = formData.get("isActive") === "1";
  if (!Number.isFinite(id)) return;
  await updateCoupon(id, { isActive });
  revalidatePath("/dashboard/coupons");
}
