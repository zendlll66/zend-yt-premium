"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveMembershipPlanAction, type SavePlanState } from "@/features/membership/membership.actions";
import type { MembershipPlanRow } from "@/features/membership/membership.repo";
import { BILLING_TYPES } from "@/db/schema/membership.schema";

type PlanFormProps = {
  plan?: MembershipPlanRow | null;
  defaultSortOrder?: number;
};

export function PlanForm({ plan, defaultSortOrder = 0 }: PlanFormProps) {
  const [state, formAction, isPending] = useActionState(saveMembershipPlanAction, {} as SavePlanState);

  return (
    <form action={formAction} className="max-w-xl space-y-6 rounded-xl border bg-card p-6">
      {plan && <input type="hidden" name="id" value={plan.id} />}
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
          ชื่อแผน
        </label>
        <Input
          id="name"
          name="name"
          defaultValue={plan?.name}
          placeholder="เช่น สมาชิกรายเดือน"
          disabled={isPending}
          required
        />
      </div>
      <div>
        <label htmlFor="billingType" className="mb-1.5 block text-sm font-medium">
          ประเภท
        </label>
        <select
          id="billingType"
          name="billingType"
          defaultValue={plan?.billingType ?? "monthly"}
          disabled={isPending}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
        >
          {BILLING_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === "monthly" ? "รายเดือน" : "รายปี"}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="price" className="mb-1.5 block text-sm font-medium">
          ราคา (บาท)
        </label>
        <Input
          id="price"
          name="price"
          type="number"
          min="0"
          step="1"
          defaultValue={plan?.price ?? ""}
          placeholder="0"
          disabled={isPending}
        />
      </div>
      <div>
        <label htmlFor="freeRentalDays" className="mb-1.5 block text-sm font-medium">
          วันเช่าฟรี (วัน)
        </label>
        <Input
          id="freeRentalDays"
          name="freeRentalDays"
          type="number"
          min="0"
          defaultValue={plan?.freeRentalDays ?? 0}
          disabled={isPending}
        />
      </div>
      <div>
        <label htmlFor="discountPercent" className="mb-1.5 block text-sm font-medium">
          ส่วนลด (%)
        </label>
        <Input
          id="discountPercent"
          name="discountPercent"
          type="number"
          min="0"
          max="100"
          step="0.5"
          defaultValue={plan?.discountPercent ?? 0}
          disabled={isPending}
        />
      </div>
      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm font-medium">
          คำอธิบายสิทธิ์ (แสดงให้ลูกค้า)
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={plan?.description ?? ""}
          placeholder="เช่น ได้วันเช่าฟรี 1 วัน ทุกเดือน"
          rows={3}
          disabled={isPending}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="sortOrder" className="mb-1.5 block text-sm font-medium">
          ลำดับแสดง
        </label>
        <Input
          id="sortOrder"
          name="sortOrder"
          type="number"
          min="0"
          defaultValue={plan?.sortOrder ?? defaultSortOrder}
          disabled={isPending}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          name="isActive"
          value="on"
          defaultChecked={plan?.isActive ?? true}
          disabled={isPending}
          className="h-4 w-4 rounded border-input"
        />
        <label htmlFor="isActive" className="text-sm font-medium">
          เปิดใช้แผน (แสดงให้ลูกค้าเลือกสมัครได้)
        </label>
      </div>
      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
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
          <Link href="/dashboard/membership-plans">ยกเลิก</Link>
        </Button>
      </div>
    </form>
  );
}
