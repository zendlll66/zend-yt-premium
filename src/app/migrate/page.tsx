"use client";

import { useActionState } from "react";
import { useState } from "react";
import { submitMigrationRequestAction } from "@/features/migration-request/migration-request.actions";
import { MIGRATION_STOCK_TYPES } from "@/db/schema/migration-request.schema";
import { CheckCircle, ArrowRight } from "lucide-react";

const STOCK_TYPE_LABELS: Record<string, string> = {
  individual: "Individual Account (บัญชีส่วนตัว)",
  family: "Family Group (กลุ่มครอบครัว)",
  invite: "Invite Link (ลิงก์เชิญ)",
  customer_account: "Customer Account (บัญชีลูกค้า)",
};

const STOCK_TYPE_DESCRIPTIONS: Record<string, string> = {
  individual: "บัญชี YouTube Premium ของคุณเอง — ต้องการ email + password เดิม",
  family: "สมาชิกในกลุ่มครอบครัว — ต้องการ email + password เดิม",
  invite: "เข้าระบบด้วย invite link — ต้องการเฉพาะ email เดิม",
  customer_account: "บัญชีลูกค้าพิเศษ — ต้องการ email + password เดิม",
};

export default function MigratePage() {
  const [state, action, pending] = useActionState(submitMigrationRequestAction, {});
  const [stockType, setStockType] = useState("individual");

  const isInvite = stockType === "invite";

  if (state.success) {
    return (
      <div className="max-w-lg mx-auto py-12 px-4 text-center space-y-4">
        <CheckCircle className="mx-auto h-14 w-14 text-green-500" />
        <h1 className="text-xl font-semibold">ส่งคำขอสำเร็จ</h1>
        <p className="text-sm text-muted-foreground">
          ทีมงานได้รับคำขอ #{state.requestId} แล้ว จะดำเนินการตรวจสอบและติดต่อกลับทางอีเมลที่ให้ไว้
        </p>
        <p className="text-xs text-muted-foreground">
          คุณสามารถตรวจสอบสถานะได้ที่หน้านี้ในภายหลัง
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">ย้ายข้อมูลจากระบบเดิม</h1>
        <p className="text-sm text-muted-foreground mt-1">
          กรอกข้อมูลที่ใช้ใน service เดิม เพื่อให้ทีมงานนำเข้าข้อมูลให้คุณ
        </p>
      </div>

      <form action={action} className="space-y-5">
        {/* ประเภทสินค้า */}
        <div className="space-y-2">
          <label className="text-sm font-medium">ประเภทสินค้าที่ใช้งาน</label>
          <div className="grid gap-2">
            {MIGRATION_STOCK_TYPES.map((type) => (
              <label
                key={type}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
                  stockType === type
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  name="stockType"
                  value={type}
                  checked={stockType === type}
                  onChange={() => setStockType(type)}
                  className="mt-0.5"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{STOCK_TYPE_LABELS[type]}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {STOCK_TYPE_DESCRIPTIONS[type]}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* อีเมลติดต่อกลับ */}
        <div className="space-y-1.5">
          <label htmlFor="contactEmail" className="text-sm font-medium">
            อีเมลติดต่อกลับ
          </label>
          <input
            id="contactEmail"
            name="contactEmail"
            type="email"
            placeholder="your@email.com"
            required
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <p className="text-xs text-muted-foreground">ทีมงานจะติดต่อกลับที่อีเมลนี้</p>
        </div>

        {/* Email ใน service เดิม */}
        <div className="space-y-1.5">
          <label htmlFor="loginEmail" className="text-sm font-medium">
            Email ที่ใช้ใน service เดิม
          </label>
          <input
            id="loginEmail"
            name="loginEmail"
            type="email"
            placeholder="email@gmail.com"
            required
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Password ใน service เดิม (ซ่อนถ้า invite) */}
        {!isInvite && (
          <div className="space-y-1.5">
            <label htmlFor="loginPassword" className="text-sm font-medium">
              รหัสผ่านที่ใช้ใน service เดิม
            </label>
            <input
              id="loginPassword"
              name="loginPassword"
              type="password"
              placeholder="••••••••"
              required={!isInvite}
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground">
              ข้อมูลนี้ใช้เพื่อยืนยันตัวตนเท่านั้น ไม่มีการเก็บหรือนำไปใช้งานอื่น
            </p>
          </div>
        )}

        {/* หมายเหตุ */}
        <div className="space-y-1.5">
          <label htmlFor="note" className="text-sm font-medium">
            หมายเหตุ (ไม่บังคับ)
          </label>
          <textarea
            id="note"
            name="note"
            rows={3}
            placeholder="ข้อมูลเพิ่มเติมที่ต้องการแจ้งทีมงาน..."
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        </div>

        {state.error && (
          <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition"
        >
          {pending ? "กำลังส่ง..." : (
            <>
              ส่งคำขอย้ายข้อมูล
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
