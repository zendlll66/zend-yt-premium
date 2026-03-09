"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  CreateKitchenCategoryState,
  UpdateKitchenCategoryState,
} from "@/features/kitchen-category/kitchen-category.actions";
import type {
  createKitchenCategoryAction,
  updateKitchenCategoryAction,
} from "@/features/kitchen-category/kitchen-category.actions";

type Props = {
  station?: { id: number; name: string } | null;
  action: typeof createKitchenCategoryAction | typeof updateKitchenCategoryAction;
};

export function StationForm({ station, action }: Props) {
  const isEdit = !!station;
  const [state, formAction, isPending] = useActionState(
    action,
    {} as CreateKitchenCategoryState & UpdateKitchenCategoryState
  );

  return (
    <form action={formAction} className="max-w-md space-y-4 rounded-xl border bg-card p-6">
      {isEdit && <input type="hidden" name="id" value={station.id} />}

      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
          ชื่อ Station *
        </label>
        <Input
          id="name"
          name="name"
          defaultValue={station?.name}
          placeholder="เช่น Grill, Bar, เครื่องดื่ม"
          required
          disabled={isPending}
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
          <Link href="/dashboard/stations">ยกเลิก</Link>
        </Button>
      </div>
    </form>
  );
}
