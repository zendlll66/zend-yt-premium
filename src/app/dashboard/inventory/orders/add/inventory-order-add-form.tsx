"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createInventoryOrderAction } from "@/features/inventory/inventory-order.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { CustomerSelectField } from "@/app/dashboard/stocks/account-stock/[id]/edit/customer-select-field";
import type { CustomerProfile } from "@/features/customer/customer.repo";
import { INVENTORY_ITEM_TYPES } from "@/db/schema/customer-inventory.schema";
import { addCalendarMonths } from "@/lib/calendar-months";

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

export function InventoryOrderAddForm({ customers }: { customers: CustomerProfile[] }) {
  const now = new Date();
  const defaultExpires = addCalendarMonths(now, 1);
  const [state, formAction, isPending] = useActionState(createInventoryOrderAction, {
    error: undefined,
  } as { error?: string });

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4 rounded-xl border bg-card p-6">
      <CustomerSelectField customers={customers} initialCustomerId={null} />
      <div>
        <label htmlFor="itemType" className="mb-1.5 block text-sm font-medium">
          ประเภท (itemType) *
        </label>
        <select
          id="itemType"
          name="itemType"
          required
          disabled={isPending}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {INVENTORY_ITEM_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="title" className="mb-1.5 block text-sm font-medium">
          Title *
        </label>
        <Input
          id="title"
          name="title"
          placeholder="เช่น YouTube Premium 1 เดือน"
          required
          disabled={isPending}
          className="w-full"
        />
      </div>
      <div>
        <label htmlFor="loginEmail" className="mb-1.5 block text-sm font-medium">
          Login Email / Username
        </label>
        <Input
          id="loginEmail"
          name="loginEmail"
          placeholder="อีเมลหรือ username ที่ส่งให้ลูกค้า"
          disabled={isPending}
          className="w-full"
        />
      </div>
      <div>
        <label htmlFor="loginPassword" className="mb-1.5 block text-sm font-medium">
          Login Password
        </label>
        <Input
          id="loginPassword"
          name="loginPassword"
          type="password"
          autoComplete="new-password"
          placeholder="รหัสผ่าน (ถ้ามี)"
          disabled={isPending}
          className="w-full"
        />
      </div>
      <div>
        <label htmlFor="inviteLink" className="mb-1.5 block text-sm font-medium">
          Invite Link
        </label>
        <Input
          id="inviteLink"
          name="inviteLink"
          placeholder="https://..."
          disabled={isPending}
          className="w-full"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="durationMonths" className="mb-1.5 block text-sm font-medium">
            จำนวนเดือน *
          </label>
          <Input
            id="durationMonths"
            name="durationMonths"
            type="number"
            min={1}
            defaultValue={1}
            disabled={isPending}
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="activatedAt" className="mb-1.5 block text-sm font-medium">
            วันที่เริ่ม (activatedAt)
          </label>
          <Input
            id="activatedAt"
            name="activatedAt"
            type="datetime-local"
            defaultValue={toDatetimeLocal(now)}
            disabled={isPending}
            className="w-full"
          />
        </div>
      </div>
      <div>
        <label htmlFor="expiresAt" className="mb-1.5 block text-sm font-medium">
          วันที่หมดอายุ (expiresAt) — ว่างไว้ใช้ เริ่มต้น + จำนวนเดือน (ตามปฏิทิน)
        </label>
        <Input
          id="expiresAt"
          name="expiresAt"
          type="datetime-local"
          defaultValue={toDatetimeLocal(defaultExpires)}
          disabled={isPending}
          className="w-full"
        />
      </div>
      <div>
        <label htmlFor="note" className="mb-1.5 block text-sm font-medium">
          หมายเหตุ
        </label>
        <Input
          id="note"
          name="note"
          placeholder="หมายเหตุ (ถ้ามี)"
          disabled={isPending}
          className="w-full"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      <div className="flex gap-2">
        <FormSubmitButton loadingText="กำลังสร้าง…">สร้าง Order + Inventory</FormSubmitButton>
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard/inventory/orders/active">ยกเลิก</Link>
        </Button>
      </div>
    </form>
  );
}
