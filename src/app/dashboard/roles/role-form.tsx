"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createRoleAction, updateRoleAction } from "@/features/role/role.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RoleRow } from "@/features/role/role.repo";

type Props = { role?: RoleRow | null };

function createSubmitAction(role: RoleRow | null) {
  return async (prev: { error?: string }, formData: FormData) => {
    if (role) {
      return updateRoleAction(role.id, formData);
    }
    return createRoleAction(formData);
  };
}

export function RoleForm({ role }: Props) {
  const isEdit = !!role;
  const [state, formAction, isPending] = useActionState(createSubmitAction(role ?? null), {} as { error?: string; ok?: boolean });

  if (state?.ok) {
    return (
      <div className="max-w-md rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
        <p className="font-medium text-green-800 dark:text-green-200">
          {isEdit ? "อัปเดตบทบาทแล้ว" : "สร้างบทบาทแล้ว"}
        </p>
        <Button variant="outline" size="sm" className="mt-2" asChild>
          <Link href="/dashboard/roles">กลับไปรายการบทบาท</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="max-w-md space-y-4 rounded-xl border bg-card p-6">
      {isEdit && <input type="hidden" name="id" value={role.id} />}
      <div>
        <label htmlFor="slug" className="mb-1.5 block text-sm font-medium">
          Slug (ภาษาอังกฤษ ไม่มีช่องว่าง)
        </label>
        <Input
          id="slug"
          name="slug"
          defaultValue={role?.slug}
          placeholder="เช่น staff, manager"
          required
          disabled={isPending}
          className="font-mono"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          ใช้เป็นค่าบทบาทในระบบ (แก้ไขได้ แต่ต้องไม่ซ้ำบทบาทอื่น)
        </p>
      </div>
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
          ชื่อบทบาท
        </label>
        <Input
          id="name"
          name="name"
          defaultValue={role?.name ?? ""}
          placeholder="เช่น พนักงานขาย"
          required
          disabled={isPending}
        />
      </div>
      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm font-medium">
          คำอธิบาย (ไม่บังคับ)
        </label>
        <Input
          id="description"
          name="description"
          defaultValue={role?.description ?? ""}
          placeholder="อธิบายสิทธิ์โดยรวม"
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
          {isPending ? "กำลังบันทึก…" : isEdit ? "บันทึก" : "สร้างบทบาท"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard/roles">ยกเลิก</Link>
        </Button>
      </div>
    </form>
  );
}
