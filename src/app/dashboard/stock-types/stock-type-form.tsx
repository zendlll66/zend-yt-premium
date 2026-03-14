"use client";

import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/image-upload";
import { RichTextEditor } from "@/components/rich-text-editor";
import { saveStockTypeDescriptionAction, type SaveStockTypeDescriptionState } from "@/features/stock-type-descriptions/stock-type-descriptions.actions";
import type { StockTypeDescription } from "@/features/stock-type-descriptions/stock-type-descriptions.repo";
import type { ProductStockType } from "@/db/schema/product.schema";

const STOCK_TYPE_LABELS: Record<ProductStockType, string> = {
  individual: "Individual (รายบุคคล)",
  family: "Family (ครอบครัว)",
  invite: "Invite (ลิงก์เชิญ)",
  customer_account: "Customer Account (บัญชีลูกค้า)",
};

const FOLDER = "stock-types";

type Props = { item: StockTypeDescription };

export function StockTypeForm({ item }: Props) {
  const [name, setName] = React.useState(item.name);
  const [description, setDescription] = React.useState(item.description);
  const [imageKey, setImageKey] = React.useState(item.imageKey);

  const [state, formAction, isPending] = useActionState(saveStockTypeDescriptionAction, {} as SaveStockTypeDescriptionState);

  React.useEffect(() => {
    setName(item.name);
    setDescription(item.description);
    setImageKey(item.imageKey);
  }, [item.slug, item.name, item.description, item.imageKey]);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border bg-card p-6">
      <input type="hidden" name="slug" value={item.slug} />
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="description" value={description} />
      <input type="hidden" name="imageKey" value={imageKey} />

      <h2 className="text-lg font-semibold">{STOCK_TYPE_LABELS[item.slug]}</h2>

      <div>
        <label className="mb-1.5 block text-sm font-medium">ชื่อแสดง</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={STOCK_TYPE_LABELS[item.slug]}
          disabled={isPending}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">รูปประกอบ</label>
        <ImageUpload
          folder={FOLDER}
          value={imageKey}
          onChange={setImageKey}
          disabled={isPending}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">คำอธิบาย (รองรับข้อความและรูปในเนื้อหา)</label>
        <RichTextEditor
          value={description}
          onChange={setDescription}
          placeholder="อธิบายว่าประเภทนี้คืออะไร ใช้ยังไง..."
          disabled={isPending}
          minHeight="180px"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-green-600">บันทึกแล้ว</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "กำลังบันทึก..." : "บันทึก"}
      </Button>
    </form>
  );
}
