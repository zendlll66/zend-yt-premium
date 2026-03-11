"use client";

import { useState } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Package } from "lucide-react";
import {
  savePromotionAction,
  type SavePromotionState,
} from "@/features/promotion/promotion.actions";
import type { PromotionWithProductIds } from "@/features/promotion/promotion.repo";

type ProductOption = { id: number; name: string; imageUrl: string | null };

type PromotionFormProps = {
  promotion?: PromotionWithProductIds | null;
  products: ProductOption[];
};

function toDateInputValue(d: Date): string {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function PromotionForm({ promotion, products }: PromotionFormProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>(
    () => promotion?.productIds ?? []
  );
  const [state, formAction, isPending] = useActionState(
    savePromotionAction,
    {} as SavePromotionState
  );

  function toggleProduct(id: number) {
    if (isPending) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <form action={formAction} className="max-w-xl space-y-6 rounded-xl border bg-card p-6">
      {promotion && <input type="hidden" name="id" value={promotion.id} />}
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name="productIds" value={id} readOnly />
      ))}
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
          ชื่อโปร
        </label>
        <Input
          id="name"
          name="name"
          defaultValue={promotion?.name}
          placeholder="เช่น ลดเปิดร้าน"
          disabled={isPending}
          required
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
          min="1"
          max="100"
          step="1"
          defaultValue={promotion?.discountPercent ?? ""}
          placeholder="10"
          disabled={isPending}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="startAt" className="mb-1.5 block text-sm font-medium">
            วันเริ่มต้น
          </label>
          <Input
            id="startAt"
            name="startAt"
            type="date"
            defaultValue={
              promotion?.startAt
                ? toDateInputValue(promotion.startAt as Date)
                : undefined
            }
            disabled={isPending}
            required
          />
        </div>
        <div>
          <label htmlFor="endAt" className="mb-1.5 block text-sm font-medium">
            วันสิ้นสุด
          </label>
          <Input
            id="endAt"
            name="endAt"
            type="date"
            defaultValue={
              promotion?.endAt
                ? toDateInputValue(promotion.endAt as Date)
                : undefined
            }
            disabled={isPending}
            required
          />
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">
          สินค้าที่ร่วมโปร (กดเลือกได้หลายรายการ)
        </p>
        <div className="grid max-h-[320px] gap-2 overflow-y-auto rounded-lg border border-input bg-muted/30 p-2 sm:grid-cols-2">
          {products.map((p) => {
            const selected = selectedIds.includes(p.id);
            const imageSrc = p.imageUrl
              ? `/api/r2-url?key=${encodeURIComponent(p.imageUrl)}`
              : null;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleProduct(p.id)}
                disabled={isPending}
                className={`flex items-center gap-3 rounded-xl border-2 p-2 text-left transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  selected
                    ? "border-green-500 bg-green-50 dark:bg-green-950/40"
                    : "border-transparent bg-background hover:border-muted-foreground/30"
                }`}
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Package className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {p.name}
                </span>
                {selected && (
                  <span className="shrink-0 rounded-full bg-green-500 p-0.5 text-white">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {selectedIds.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            เลือกแล้ว {selectedIds.length} รายการ
          </p>
        )}
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
          <Link href="/dashboard/promotions">ยกเลิก</Link>
        </Button>
      </div>
    </form>
  );
}
