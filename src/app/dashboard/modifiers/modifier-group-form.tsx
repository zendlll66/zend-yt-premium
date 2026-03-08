"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CreateGroupState, UpdateGroupState } from "@/features/modifier/modifier.actions";
import type { createModifierGroupAction, updateModifierGroupAction } from "@/features/modifier/modifier.actions";

type Props = {
  group?: { id: number; name: string; required: boolean } | null;
  action: typeof createModifierGroupAction | typeof updateModifierGroupAction;
};

export function ModifierGroupForm({ group, action }: Props) {
  const isEdit = !!group;
  const [state, formAction, isPending] = useActionState(
    action,
    {} as CreateGroupState & UpdateGroupState
  );

  return (
    <form action={formAction} className="max-w-md space-y-4 rounded-xl border bg-card p-6">
      {isEdit && <input type="hidden" name="id" value={group.id} />}

      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
          ชื่อกลุ่ม (เช่น Size, นม)
        </label>
        <Input
          id="name"
          name="name"
          defaultValue={group?.name}
          placeholder="Size"
          required
          disabled={isPending}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="required"
          name="required"
          value="1"
          defaultChecked={group?.required ?? false}
          disabled={isPending}
          className="h-4 w-4 rounded border-input"
        />
        <label htmlFor="required" className="text-sm">
          บังคับเลือก (ลูกค้าต้องเลือกอย่างน้อย 1 ตัวเลือกในกลุ่มนี้)
        </label>
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
          <Link href="/dashboard/modifiers">ยกเลิก</Link>
        </Button>
      </div>
    </form>
  );
}
