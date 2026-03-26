"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createInventoryOrderAction } from "@/features/inventory/inventory-order.actions";
import { Input } from "@/components/ui/input";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Button } from "@/components/ui/button";
import { INVENTORY_ITEM_TYPES } from "@/db/schema/customer-inventory.schema";
import { addCalendarMonths } from "@/lib/calendar-months";
import { Plus, X } from "lucide-react";

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const ITEM_TYPE_LABELS: Record<string, string> = {
  individual: "Individual Account",
  family: "Family Group",
  invite: "Invite Link",
  customer_account: "Customer Account",
};

type Props = {
  customerId: number;
  customerName: string;
};

export function AddInventoryForm({ customerId, customerName }: Props) {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const defaultExpires = addCalendarMonths(now, 1);

  const [state, formAction, isPending] = useActionState(createInventoryOrderAction, {
    error: undefined,
  } as { error?: string });

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        เพิ่ม Inventory ใหม่
      </Button>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          สร้าง Inventory สำหรับ {customerName}
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        {/* hidden inputs */}
        <input type="hidden" name="customerId" value={customerId} />
        <input
          type="hidden"
          name="redirectTo"
          value={`/dashboard/customers/${customerId}/inventory`}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="itemType" className="mb-1.5 block text-sm font-medium">
              ประเภท *
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
                  {ITEM_TYPE_LABELS[t] ?? t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-medium">
              ชื่อรายการ (Title) *
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
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="loginEmail" className="mb-1.5 block text-sm font-medium">
              Login Email / Username
            </label>
            <Input
              id="loginEmail"
              name="loginEmail"
              placeholder="email หรือ username"
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
              placeholder="รหัสผ่าน"
              disabled={isPending}
              className="w-full"
            />
          </div>
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

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="durationMonths" className="mb-1.5 block text-sm font-medium">
              ระยะเวลา (เดือน) *
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
              วันที่เริ่ม
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
          <div>
            <label htmlFor="expiresAt" className="mb-1.5 block text-sm font-medium">
              วันที่หมดอายุ
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
          <FormSubmitButton loadingText="กำลังสร้าง…">
            สร้าง Inventory
          </FormSubmitButton>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            ยกเลิก
          </Button>
        </div>
      </form>
    </div>
  );
}
