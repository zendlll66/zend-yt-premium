"use client";

import { useState } from "react";
import Link from "next/link";
import { CustomerSelectField } from "../[id]/edit/customer-select-field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Button } from "@/components/ui/button";
import { createAccountStockAction } from "@/features/youtube/youtube-stock.actions";
import type { CustomerProfile } from "@/features/customer/customer.repo";

type Props = {
  customers: CustomerProfile[];
};

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

export function AddAccountStockForm({ customers }: Props) {
  const [customerId, setCustomerId] = useState<number | null>(null);
  const now = toDatetimeLocal(new Date());

  return (
    <form action={createAccountStockAction} className="flex max-w-lg flex-col gap-5 rounded-xl border bg-card p-6">
      {/* credentials */}
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
          Email / Username *
        </label>
        <Input
          id="email"
          name="email"
          placeholder="email หรือ username สำหรับล็อกอิน"
          required
        />
      </div>

      <div>
        <PasswordInput
          id="password"
          name="password"
          label="Password *"
          placeholder="รหัสผ่าน"
          required
        />
      </div>

      {/* status — ซ่อนเมื่อเลือกลูกค้าแล้ว (จะ auto "sold") */}
      {!customerId && (
        <div>
          <label htmlFor="status" className="mb-1.5 block text-sm font-medium">
            สถานะ
          </label>
          <select
            id="status"
            name="status"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            defaultValue="available"
          >
            <option value="available">available</option>
            <option value="reserved">reserved</option>
            <option value="sold">sold</option>
          </select>
        </div>
      )}

      {/* customer select */}
      <CustomerSelectField
        customers={customers}
        initialCustomerId={null}
        onSelect={setCustomerId}
      />

      {/* inventory fields — แสดงเมื่อเลือกลูกค้า */}
      {customerId && (
        <div className="flex flex-col gap-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
          <p className="text-xs font-semibold text-primary">
            สร้าง Inventory สำหรับลูกค้านี้พร้อมกันเลย
          </p>

          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-medium">
              ชื่อรายการ (Title)
            </label>
            <Input
              id="title"
              name="title"
              placeholder="เช่น YouTube Premium 1 เดือน (ถ้าไม่กรอก ใช้ email แทน)"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="activatedAt" className="mb-1.5 block text-sm font-medium">
                วันที่เริ่ม (activatedAt)
              </label>
              <Input
                id="activatedAt"
                name="activatedAt"
                type="datetime-local"
                lang="th-TH"
                defaultValue={now}
              />
            </div>
            <div>
              <label htmlFor="expiresAt" className="mb-1.5 block text-sm font-medium">
                วันที่หมดอายุ (expiresAt)
              </label>
              <Input
                id="expiresAt"
                name="expiresAt"
                type="datetime-local"
                lang="th-TH"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                ถ้าไม่กรอก จะคำนวณจาก duration
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="durationMonths" className="mb-1.5 block text-sm font-medium">
              ระยะเวลา (เดือน) — ใช้คำนวณ expiresAt ถ้าไม่กรอกวันหมดอายุ
            </label>
            <Input
              id="durationMonths"
              name="durationMonths"
              type="number"
              min={1}
              defaultValue={1}
              className="w-28"
            />
          </div>

          <div>
            <label htmlFor="note" className="mb-1.5 block text-sm font-medium">
              หมายเหตุ
            </label>
            <Input id="note" name="note" placeholder="หมายเหตุ (ถ้ามี)" />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <FormSubmitButton loadingText="กำลังเพิ่ม…">เพิ่ม stock</FormSubmitButton>
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard/stocks/account-stock">ยกเลิก</Link>
        </Button>
      </div>
    </form>
  );
}
