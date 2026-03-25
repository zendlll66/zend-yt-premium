"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  saveCouponAction,
  type SaveCouponState,
} from "@/features/coupon/coupon.actions";
import type { CouponRow } from "@/features/coupon/coupon.repo";

function toDateInputValue(d: Date | null | undefined) {
  if (!d) return "";
  const x = new Date(d);
  return x.toISOString().split("T")[0];
}

export function CouponForm({ coupon }: { coupon?: CouponRow | null }) {
  const [state, formAction, isPending] = useActionState(
    saveCouponAction,
    {} as SaveCouponState
  );

  return (
    <form action={formAction} className="max-w-xl space-y-5 rounded-xl border bg-card p-6">
      {coupon && <input type="hidden" name="id" value={coupon.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">รหัส Coupon *</label>
          <Input
            name="code"
            defaultValue={coupon?.code}
            placeholder="เช่น SAVE20"
            disabled={isPending}
            required
            className="uppercase"
          />
          <p className="mt-1 text-xs text-muted-foreground">จะถูกแปลงเป็นตัวพิมพ์ใหญ่อัตโนมัติ</p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">ชื่อ/คำอธิบาย *</label>
          <Input
            name="name"
            defaultValue={coupon?.name}
            placeholder="เช่น ส่วนลดลูกค้าใหม่"
            disabled={isPending}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">ประเภทส่วนลด *</label>
          <select
            name="discountType"
            defaultValue={coupon?.discountType ?? "percent"}
            disabled={isPending}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="percent">เปอร์เซ็นต์ (%)</option>
            <option value="fixed">จำนวนเงิน (บาท)</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">มูลค่าส่วนลด *</label>
          <Input
            name="discountValue"
            type="number"
            min="0.01"
            step="0.01"
            defaultValue={coupon?.discountValue ?? ""}
            placeholder="10"
            disabled={isPending}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">ยอดขั้นต่ำ (บาท)</label>
          <Input
            name="minOrderAmount"
            type="number"
            min="0"
            step="1"
            defaultValue={coupon?.minOrderAmount ?? 0}
            placeholder="0"
            disabled={isPending}
          />
          <p className="mt-1 text-xs text-muted-foreground">0 = ไม่มีขั้นต่ำ</p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">จำนวนครั้งสูงสุด</label>
          <Input
            name="maxUses"
            type="number"
            min="1"
            step="1"
            defaultValue={coupon?.maxUses ?? ""}
            placeholder="ว่าง = ไม่จำกัด"
            disabled={isPending}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">วันหมดอายุ</label>
        <Input
          name="expiresAt"
          type="date"
          defaultValue={toDateInputValue(coupon?.expiresAt)}
          disabled={isPending}
        />
        <p className="mt-1 text-xs text-muted-foreground">ว่าง = ไม่มีวันหมดอายุ</p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">จำกัดลูกค้า ID (ว่าง = ทุกคน)</label>
        <Input
          name="customerId"
          type="number"
          defaultValue={coupon?.customerId ?? ""}
          placeholder="Customer ID"
          disabled={isPending}
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          id="isActive"
          type="checkbox"
          name="isActive"
          value="1"
          defaultChecked={coupon?.isActive ?? true}
          disabled={isPending}
          className="h-4 w-4 rounded border-input"
        />
        <label htmlFor="isActive" className="text-sm font-medium">
          เปิดใช้งาน
        </label>
      </div>

      {state?.error && (
        <p className="text-sm text-destructive" role="alert">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-green-600 dark:text-green-400" role="status">
          บันทึกเรียบร้อย
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "กำลังบันทึก…" : "บันทึก"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard/coupons">ยกเลิก</Link>
        </Button>
      </div>
    </form>
  );
}
