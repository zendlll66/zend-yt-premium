"use client";

import { useState } from "react";
import Link from "next/link";
import { CustomerSelectField } from "./customer-select-field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Button } from "@/components/ui/button";
import {
  updateAccountStockAction,
  createStockInventoryAction,
} from "@/features/youtube/youtube-stock.actions";
import { updateInventoryDatesAction } from "@/features/inventory/inventory-order.actions";
import type { CustomerProfile } from "@/features/customer/customer.repo";

type StockData = {
  id: number;
  email: string;
  password: string;
  status: "available" | "reserved" | "sold";
  orderId: number | null;
  customerId: number | null;
  soldAt: string | null;
  updatedAt: string | null;
};

type InventoryData = {
  id: number;
  activatedAt: string | null;
  expiresAt: string | null;
  note: string | null;
};

type Props = {
  stock: StockData;
  inventory: InventoryData | null;
  customers: CustomerProfile[];
};

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateTimeTH(iso: string | null): string {
  if (!iso) return "--/--/---- --:--";
  return new Date(iso).toLocaleString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function EditAccountStockForm({ stock, inventory, customers }: Props) {
  const [customerId, setCustomerId] = useState<number | null>(stock.customerId);
  const nowIso = new Date().toISOString();

  return (
    <div className="flex flex-col gap-5 max-w-xl">
      {/* ─── ฟอร์มหลัก: credentials + customer ─── */}
      <form
        action={updateAccountStockAction}
        className="flex flex-col gap-4 rounded-xl border bg-card p-6"
      >
        <input type="hidden" name="id" value={stock.id} />

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            Email / Username *
          </label>
          <Input
            id="email"
            name="email"
            defaultValue={stock.email}
            placeholder="email หรือ username"
            required
            className="w-full"
          />
        </div>

        <div>
          <PasswordInput
            id="password"
            name="password"
            label="Password *"
            defaultValue={stock.password}
            placeholder="รหัสผ่าน"
            required
          />
        </div>

        <div>
          <label htmlFor="status" className="mb-1.5 block text-sm font-medium">
            สถานะ
          </label>
          <select
            id="status"
            name="status"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            defaultValue={stock.status}
          >
            <option value="available">available</option>
            <option value="reserved">reserved</option>
            <option value="sold">sold</option>
          </select>
        </div>

        {/* orderId (hidden detail) */}
        <div>
          <label htmlFor="orderId" className="mb-1.5 block text-sm font-medium">
            Order ID
          </label>
          <Input
            id="orderId"
            name="orderId"
            type="number"
            min={1}
            step={1}
            placeholder="ว่างไว้ถ้าไม่มี"
            defaultValue={stock.orderId ?? ""}
            className="w-full"
          />
        </div>

        {/* soldAt */}
        <div>
          <label htmlFor="soldAt" className="mb-1.5 block text-sm font-medium">
            เวลาขาย (soldAt)
          </label>
          <Input
            id="soldAt"
            name="soldAt"
            type="datetime-local"
            lang="th-TH"
            defaultValue={toDatetimeLocal(stock.soldAt)}
            className="w-full"
          />
          <div className="mt-1 text-xs text-muted-foreground">
            {formatDateTimeTH(stock.soldAt)}
          </div>
        </div>

        {/* Customer select */}
        <CustomerSelectField
          customers={customers}
          initialCustomerId={stock.customerId}
          onSelect={setCustomerId}
        />

        {customerId !== stock.customerId && customerId !== null && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
            เปลี่ยนลูกค้า → Inventory และ Order ที่ผูกอยู่จะถูก update customerId ด้วยอัตโนมัติ
          </p>
        )}

        <div className="flex gap-2">
          <FormSubmitButton loadingText="กำลังบันทึก…">บันทึก</FormSubmitButton>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/stocks/account-stock">ยกเลิก</Link>
          </Button>
        </div>
      </form>

      {/* ─── แก้ไข Inventory dates — มี inventory อยู่แล้ว ─── */}
      {inventory && (
        <form
          action={updateInventoryDatesAction}
          className="flex flex-col gap-4 rounded-xl border bg-card p-6"
        >
          <input type="hidden" name="id" value={inventory.id} />
          <input
            type="hidden"
            name="redirectTo"
            value={`/dashboard/stocks/account-stock/${stock.id}/edit`}
          />

          <h2 className="text-sm font-semibold">
            แก้ไขวันเริ่ม / หมดอายุ (Inventory #{inventory.id})
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="inv-activatedAt" className="mb-1.5 block text-sm font-medium">
                วันที่เริ่ม (activatedAt)
              </label>
              <Input
                id="inv-activatedAt"
                name="activatedAt"
                type="datetime-local"
                lang="th-TH"
                defaultValue={toDatetimeLocal(inventory.activatedAt)}
                className="w-full"
              />
              <div className="mt-1 text-xs text-muted-foreground">
                {formatDateTimeTH(inventory.activatedAt)}
              </div>
            </div>
            <div>
              <label htmlFor="inv-expiresAt" className="mb-1.5 block text-sm font-medium">
                วันที่หมดอายุ (expiresAt) — เลื่อนต่ออายุได้
              </label>
              <Input
                id="inv-expiresAt"
                name="expiresAt"
                type="datetime-local"
                lang="th-TH"
                defaultValue={toDatetimeLocal(inventory.expiresAt)}
                className="w-full"
              />
              <div className="mt-1 text-xs text-muted-foreground">
                {formatDateTimeTH(inventory.expiresAt)}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="inv-note" className="mb-1.5 block text-sm font-medium">
              หมายเหตุ
            </label>
            <Input
              id="inv-note"
              name="note"
              defaultValue={inventory.note ?? ""}
              className="w-full"
            />
          </div>

          <div className="flex gap-2">
            <FormSubmitButton loadingText="กำลังบันทึก…">บันทึกวันเริ่ม/หมดอายุ</FormSubmitButton>
          </div>
        </form>
      )}

      {/* ─── สร้าง Inventory ใหม่ — มีลูกค้าแต่ยังไม่มี inventory ─── */}
      {!inventory && customerId && (
        <form
          action={createStockInventoryAction}
          className="flex flex-col gap-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-6"
        >
          <input type="hidden" name="stockId" value={stock.id} />
          <input type="hidden" name="customerId" value={customerId} />

          <h2 className="text-sm font-semibold text-primary">
            สร้าง Inventory สำหรับลูกค้านี้
          </h2>

          <div>
            <label htmlFor="create-title" className="mb-1.5 block text-sm font-medium">
              ชื่อรายการ (Title)
            </label>
            <Input
              id="create-title"
              name="title"
              placeholder={`เช่น YouTube Premium 1 เดือน (ถ้าว่างใช้ "${stock.email}")`}
              className="w-full"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="create-activatedAt" className="mb-1.5 block text-sm font-medium">
                วันที่เริ่ม (activatedAt)
              </label>
              <Input
                id="create-activatedAt"
                name="activatedAt"
                type="datetime-local"
                lang="th-TH"
                defaultValue={toDatetimeLocal(nowIso)}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="create-expiresAt" className="mb-1.5 block text-sm font-medium">
                วันที่หมดอายุ (expiresAt)
              </label>
              <Input
                id="create-expiresAt"
                name="expiresAt"
                type="datetime-local"
                lang="th-TH"
                className="w-full"
              />
              <p className="mt-1 text-xs text-muted-foreground">ถ้าไม่กรอก คำนวณจาก duration</p>
            </div>
          </div>

          <div>
            <label htmlFor="create-duration" className="mb-1.5 block text-sm font-medium">
              ระยะเวลา (เดือน)
            </label>
            <Input
              id="create-duration"
              name="durationMonths"
              type="number"
              min={1}
              defaultValue={1}
              className="w-28"
            />
          </div>

          <div>
            <label htmlFor="create-note" className="mb-1.5 block text-sm font-medium">
              หมายเหตุ
            </label>
            <Input id="create-note" name="note" className="w-full" />
          </div>

          <div className="flex gap-2">
            <FormSubmitButton loadingText="กำลังสร้าง…">สร้าง Inventory</FormSubmitButton>
          </div>
        </form>
      )}

      {/* ─── แนะนำให้เลือกลูกค้าก่อน ─── */}
      {!inventory && !customerId && (
        <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
          เลือกลูกค้าด้านบนก่อน แล้วบันทึก เพื่อสร้าง Inventory ที่มีวันเริ่ม/หมดอายุ
        </div>
      )}
    </div>
  );
}
