"use client";

import { useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/image-upload";
import { saveSettingsAction, type SaveSettingsState } from "@/features/settings/settings.actions";
import type { ShopSettings } from "@/features/settings/settings.repo";

type Props = { initial: ShopSettings };

export function SettingsForm({ initial }: Props) {
  const [state, formAction, isPending] = useActionState(saveSettingsAction, {} as SaveSettingsState);
  const [shopLogo, setShopLogo] = useState(initial.shopLogo);

  return (
    <form action={formAction} className="space-y-8">
      {/* ข้อมูลร้าน */}
      <section className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 font-semibold">ข้อมูลร้าน</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium">โลโก้ร้าน</label>
            <ImageUpload
              folder="shop"
              value={shopLogo}
              onChange={setShopLogo}
              name="shopLogo"
              disabled={isPending}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="shopDescription" className="mb-1.5 block text-sm font-medium">
              คำอธิบายร้าน
            </label>
            <textarea
              id="shopDescription"
              name="shopDescription"
              defaultValue={initial.shopDescription}
              placeholder="คำอธิบายร้าน สินค้าและบริการ ฯลฯ"
              rows={4}
              disabled={isPending}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="shopName" className="mb-1.5 block text-sm font-medium">
              ชื่อร้าน
            </label>
            <Input
              id="shopName"
              name="shopName"
              defaultValue={initial.shopName}
              placeholder="เช่น ร้านอาหาร ZEnd"
              disabled={isPending}
            />
          </div>
          <div>
            <label htmlFor="shopPhone" className="mb-1.5 block text-sm font-medium">
              เบอร์โทร
            </label>
            <Input
              id="shopPhone"
              name="shopPhone"
              defaultValue={initial.shopPhone}
              placeholder="02-xxx-xxxx"
              disabled={isPending}
            />
          </div>
          <div>
            <label htmlFor="shopTaxId" className="mb-1.5 block text-sm font-medium">
              เลขประจำตัวผู้เสียภาษี
            </label>
            <Input
              id="shopTaxId"
              name="shopTaxId"
              defaultValue={initial.shopTaxId}
              placeholder="เลข 13 หลัก"
              disabled={isPending}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="shopAddress" className="mb-1.5 block text-sm font-medium">
              ที่อยู่
            </label>
            <Input
              id="shopAddress"
              name="shopAddress"
              defaultValue={initial.shopAddress}
              placeholder="ที่อยู่ร้าน"
              disabled={isPending}
            />
          </div>
        </div>
      </section>

      {/* ใบเสร็จ / พิมพ์ */}
      <section className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 font-semibold">ใบเสร็จ / การพิมพ์</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="receiptHeader" className="mb-1.5 block text-sm font-medium">
              ข้อความหัวใบเสร็จ (บรรทัดแรก)
            </label>
            <Input
              id="receiptHeader"
              name="receiptHeader"
              defaultValue={initial.receiptHeader}
              placeholder="เช่น ยินดีต้อนรับ / Welcome"
              disabled={isPending}
            />
          </div>
          <div>
            <label htmlFor="receiptFooter" className="mb-1.5 block text-sm font-medium">
              ข้อความท้ายใบเสร็จ
            </label>
            <Input
              id="receiptFooter"
              name="receiptFooter"
              defaultValue={initial.receiptFooter}
              placeholder="เช่น ขอบคุณที่ใช้บริการ"
              disabled={isPending}
            />
          </div>
          <div className="max-w-xs">
            <label htmlFor="currency" className="mb-1.5 block text-sm font-medium">
              สกุลเงิน
            </label>
            <Input
              id="currency"
              name="currency"
              defaultValue={initial.currency}
              placeholder="THB"
              disabled={isPending}
            />
          </div>
        </div>
      </section>

      {/* ภาษีและค่าบริการ */}
      <section className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 font-semibold">ภาษีและค่าบริการ</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="vatPercent" className="mb-1.5 block text-sm font-medium">
              ภาษีมูลค่าเพิ่ม (VAT) %
            </label>
            <Input
              id="vatPercent"
              name="vatPercent"
              type="number"
              min="0"
              max="100"
              step="0.01"
              defaultValue={initial.vatPercent}
              disabled={isPending}
            />
          </div>
          <div>
            <label htmlFor="serviceChargePercent" className="mb-1.5 block text-sm font-medium">
              ค่าบริการ (Service charge) %
            </label>
            <Input
              id="serviceChargePercent"
              name="serviceChargePercent"
              type="number"
              min="0"
              max="100"
              step="0.01"
              defaultValue={initial.serviceChargePercent}
              disabled={isPending}
            />
          </div>
        </div>
      </section>

      {/* อื่นๆ */}
      <section className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 font-semibold">อื่นๆ</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="timezone" className="mb-1.5 block text-sm font-medium">
              โซนเวลา (Timezone)
            </label>
            <Input
              id="timezone"
              name="timezone"
              defaultValue={initial.timezone}
              placeholder="Asia/Bangkok"
              disabled={isPending}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="openingHours" className="mb-1.5 block text-sm font-medium">
              เวลาเปิด-ปิด (แสดงในใบเสร็จ/ร้าน)
            </label>
            <Input
              id="openingHours"
              name="openingHours"
              defaultValue={initial.openingHours}
              placeholder="เช่น จ-อ 11:00–22:00, อ休"
              disabled={isPending}
            />
          </div>
        </div>
      </section>

      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-sm text-green-600 dark:text-green-400" role="status">
          บันทึกการตั้งค่าเรียบร้อย
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "กำลังบันทึก…" : "บันทึกการตั้งค่า"}
        </Button>
      </div>
    </form>
  );
}
