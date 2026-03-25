"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/image-upload";
import type { CreateProductState, UpdateProductState } from "@/features/product/product.actions";
import type { createProductAction, updateProductAction } from "@/features/product/product.actions";

type ProductRow = {
  id: number;
  name: string;
  categoryId: number | null;
  price: number;
  deposit: number | null;
  cost: number | null;
  sku: string | null;
  barcode: string | null;
  imageUrl: string | null;
  description: string | null;
  durationMonths: number;
  stockType?: "individual" | "family" | "invite" | "customer_account";
  isActive: boolean;
};

type Props = {
  categories: { id: number; name: string }[];
  product?: ProductRow | null;
  action: typeof createProductAction | typeof updateProductAction;
};

export function ProductForm({ categories, product, action }: Props) {
  const isEdit = !!product;
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [state, formAction, isPending] = useActionState(
    action,
    {} as CreateProductState & UpdateProductState
  );

  return (
    <form action={formAction} className="max-w-lg space-y-4 rounded-xl border bg-card p-6">
      {isEdit && <input type="hidden" name="id" value={product.id} />}

      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
          ชื่อแพ็กเกจ *
        </label>
        <Input
          id="name"
          name="name"
          defaultValue={product?.name}
          placeholder="เช่น YouTube Premium Individual 1 เดือน"
          required
          disabled={isPending}
        />
      </div>

      <div>
        <label htmlFor="category_id" className="mb-1.5 block text-sm font-medium">
          หมวดหมู่
        </label>
        <select
          id="category_id"
          name="category_id"
          defaultValue={product?.categoryId ?? ""}
          className="h-9 w-full rounded-4xl border border-input bg-input/30 px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={isPending}
        >
          <option value="">-- ไม่ระบุ --</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="mb-1.5 block text-sm font-medium">
            ราคาขาย (บาท) *
          </label>
          <Input
            id="price"
            name="price"
            type="number"
            min={0}
            step={0.01}
            defaultValue={product?.price ?? ""}
            required
            disabled={isPending}
          />
        </div>
        <div>
          <label htmlFor="deposit" className="mb-1.5 block text-sm font-medium">
            ราคาเดิม (ถ้ามี)
          </label>
          <Input
            id="deposit"
            name="deposit"
            type="number"
            min={0}
            step={0.01}
            defaultValue={product?.deposit ?? ""}
            placeholder="ใช้ทำราคาโปรโมชันได้"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="cost" className="mb-1.5 block text-sm font-medium">
            ต้นทุนต่อออเดอร์
          </label>
          <Input
            id="cost"
            name="cost"
            type="number"
            min={0}
            step={0.01}
            defaultValue={product?.cost ?? ""}
            disabled={isPending}
          />
        </div>
        <div>
          <label htmlFor="stock_type" className="mb-1.5 block text-sm font-medium">
            ประเภทสต็อก *
          </label>
          <select
            id="stock_type"
            name="stock_type"
            defaultValue={product?.stockType ?? "individual"}
            className="h-9 w-full rounded-4xl border border-input bg-input/30 px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={isPending}
          >
            <option value="individual">Individual Account</option>
            <option value="family">Family Group</option>
            <option value="invite">Invite Link</option>
            <option value="customer_account">Customer Account</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="duration_months" className="mb-1.5 block text-sm font-medium">
          อายุแพ็กเกจ (จำนวนเดือน) *
        </label>
        <Input
          id="duration_months"
          name="duration_months"
          type="number"
          min={1}
          step={1}
          defaultValue={product?.durationMonths ?? 1}
          required
          disabled={isPending}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          วันหมดอายุคำนวณจากวันที่เปิดใช้งาน โดยบวกเดือนตามปฏิทิน (เช่น ซื้อวันที่ 23 ของเดือน → หมดวันที่ 23 ของเดือนถัดไป)
        </p>
      </div>

      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm font-medium">
          รายละเอียดแพ็กเกจ
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={product?.description ?? ""}
          placeholder="เช่น ระยะเวลาใช้งาน, เงื่อนไข, วิธีส่งมอบ"
          rows={3}
          disabled={isPending}
          className="w-full rounded-lg border border-input bg-input/30 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="sku" className="mb-1.5 block text-sm font-medium">
            SKU
          </label>
          <Input
            id="sku"
            name="sku"
            defaultValue={product?.sku ?? ""}
            placeholder="SKU"
            disabled={isPending}
          />
        </div>
        <div>
          <label htmlFor="barcode" className="mb-1.5 block text-sm font-medium">
            Barcode
          </label>
          <Input
            id="barcode"
            name="barcode"
            defaultValue={product?.barcode ?? ""}
            placeholder="Barcode"
            disabled={isPending}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">รูปภาพ</label>
        <ImageUpload
          folder="products"
          name="image_url"
          value={imageUrl}
          onChange={setImageUrl}
          disabled={isPending}
        />
      </div>

      {isEdit && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            value="1"
            defaultChecked={product?.isActive ?? true}
            disabled={isPending}
            className="h-4 w-4 rounded border-input"
          />
          <label htmlFor="is_active" className="text-sm">
            เปิดขายแพ็กเกจนี้
          </label>
        </div>
      )}

      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "กำลังบันทึก…" : "บันทึก"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard/products">ยกเลิก</Link>
        </Button>
      </div>
    </form>
  );
}
