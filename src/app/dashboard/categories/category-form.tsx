"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/image-upload";
import type { CreateCategoryState, UpdateCategoryState } from "@/features/category/category.actions";
import type { createCategoryAction, updateCategoryAction } from "@/features/category/category.actions";

type Props = {
  category?: { id: number; name: string; imageUrl: string | null; detail: string | null } | null;
  action: typeof createCategoryAction | typeof updateCategoryAction;
};

export function CategoryForm({ category, action }: Props) {
  const isEdit = !!category;
  const [imageUrl, setImageUrl] = useState(category?.imageUrl ?? "");
  const [state, formAction, isPending] = useActionState(
    action,
    {} as CreateCategoryState & UpdateCategoryState
  );

  return (
    <form action={formAction} className="max-w-md space-y-4 rounded-xl border bg-card p-6">
      {isEdit && <input type="hidden" name="id" value={category.id} />}

      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
          ชื่อหมวดหมู่ *
        </label>
        <Input
          id="name"
          name="name"
          defaultValue={category?.name}
          placeholder="ชื่อหมวดหมู่"
          required
          disabled={isPending}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">รูปหมวดหมู่</label>
        <ImageUpload
          folder="categories"
          value={imageUrl}
          onChange={setImageUrl}
          name="image_url"
          disabled={isPending}
        />
      </div>

      <div>
        <label htmlFor="detail" className="mb-1.5 block text-sm font-medium">
          รายละเอียด (ไม่บังคับ)
        </label>
        <textarea
          id="detail"
          name="detail"
          defaultValue={category?.detail ?? ""}
          placeholder="เช่น หมวดหมู่บัญชี YouTube Premium"
          rows={3}
          disabled={isPending}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        />
      </div>

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
          <Link href="/dashboard/categories">ยกเลิก</Link>
        </Button>
      </div>
    </form>
  );
}
