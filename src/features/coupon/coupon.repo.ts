import { db } from "@/db";
import { coupons, couponUsages } from "@/db/schema/coupon.schema";
import { customers } from "@/db/schema/customer.schema";
import { eq, desc, sql, and, isNull, or, gte } from "drizzle-orm";

export type CouponRow = typeof coupons.$inferSelect;
export type CouponInsert = typeof coupons.$inferInsert;

export type ValidateCouponResult =
  | { ok: true; coupon: CouponRow; discountAmount: number }
  | { ok: false; error: string };

/** ตรวจสอบ coupon ก่อน checkout */
export async function validateCoupon(
  code: string,
  customerId: number,
  orderAmount: number
): Promise<ValidateCouponResult> {
  const normalizedCode = code.trim().toUpperCase();
  const [coupon] = await db
    .select()
    .from(coupons)
    .where(eq(sql`UPPER(${coupons.code})`, normalizedCode))
    .limit(1);

  if (!coupon) return { ok: false, error: "ไม่พบรหัส coupon นี้" };
  if (!coupon.isActive) return { ok: false, error: "Coupon นี้ถูกปิดการใช้งานแล้ว" };

  const now = new Date();
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
    return { ok: false, error: "Coupon นี้หมดอายุแล้ว" };
  }

  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, error: "Coupon นี้ถูกใช้ครบจำนวนแล้ว" };
  }

  if (coupon.customerId != null && coupon.customerId !== customerId) {
    return { ok: false, error: "Coupon นี้ไม่สามารถใช้ได้กับบัญชีของคุณ" };
  }

  if (orderAmount < coupon.minOrderAmount) {
    return {
      ok: false,
      error: `ยอดสั่งซื้อต้องไม่ต่ำกว่า ${coupon.minOrderAmount.toLocaleString("th-TH")} บาท`,
    };
  }

  // ตรวจสอบว่าลูกค้าใช้ coupon นี้ไปแล้วหรือยัง
  const [existing] = await db
    .select({ id: couponUsages.id })
    .from(couponUsages)
    .where(
      and(eq(couponUsages.couponId, coupon.id), eq(couponUsages.customerId, customerId))
    )
    .limit(1);
  if (existing) return { ok: false, error: "คุณเคยใช้ coupon นี้ไปแล้ว" };

  // คำนวณส่วนลด
  let discountAmount = 0;
  if (coupon.discountType === "percent") {
    discountAmount = Math.round(orderAmount * (coupon.discountValue / 100) * 100) / 100;
  } else {
    discountAmount = Math.min(coupon.discountValue, orderAmount);
  }

  return { ok: true, coupon, discountAmount };
}

/** บันทึกการใช้งาน coupon หลัง order สร้างสำเร็จ */
export async function recordCouponUsage(
  couponId: number,
  customerId: number,
  orderId: number,
  discountAmount: number
): Promise<void> {
  await db.insert(couponUsages).values({
    couponId,
    customerId,
    orderId,
    discountAmount,
  });
  // เพิ่ม usedCount
  await db
    .update(coupons)
    .set({ usedCount: sql`${coupons.usedCount} + 1` })
    .where(eq(coupons.id, couponId));
}

/** รายการ coupon ทั้งหมด (admin) */
export async function listCoupons() {
  return db.select().from(coupons).orderBy(desc(coupons.createdAt));
}

/** ดู coupon เดี่ยว */
export async function getCouponById(id: number): Promise<CouponRow | null> {
  const [row] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
  return row ?? null;
}

/** สร้าง coupon ใหม่ */
export async function createCoupon(data: Omit<CouponInsert, "id" | "usedCount" | "createdAt" | "updatedAt">) {
  const [row] = await db
    .insert(coupons)
    .values({ ...data, code: data.code.toUpperCase(), usedCount: 0 })
    .returning();
  return row;
}

/** แก้ไข coupon */
export async function updateCoupon(
  id: number,
  data: Partial<Omit<CouponInsert, "id" | "createdAt">>
) {
  if (data.code) data.code = data.code.toUpperCase();
  const [row] = await db.update(coupons).set(data).where(eq(coupons.id, id)).returning();
  return row ?? null;
}

/** ลบ coupon */
export async function deleteCoupon(id: number) {
  await db.delete(coupons).where(eq(coupons.id, id));
}

/** รายงานการใช้งาน coupon */
export async function getCouponUsagesByCode(code: string) {
  const normalizedCode = code.trim().toUpperCase();
  const [coupon] = await db
    .select()
    .from(coupons)
    .where(eq(sql`UPPER(${coupons.code})`, normalizedCode))
    .limit(1);
  if (!coupon) return [];
  return db
    .select({
      id: couponUsages.id,
      customerName: customers.name,
      customerEmail: customers.email,
      orderId: couponUsages.orderId,
      discountAmount: couponUsages.discountAmount,
      usedAt: couponUsages.usedAt,
    })
    .from(couponUsages)
    .leftJoin(customers, eq(couponUsages.customerId, customers.id))
    .where(eq(couponUsages.couponId, coupon.id))
    .orderBy(desc(couponUsages.usedAt));
}
