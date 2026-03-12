"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updatePageAction } from "@/features/page-permission/page-permission.actions";
import { RoleSelector } from "@/components/role-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Page = {
  id: number;
  path: string;
  label: string;
  roles: string[];
};

type RoleOption = { slug: string; name: string };

export function EditPageForm({ page, roles = [] }: { page: Page; roles?: RoleOption[] }) {
  const [state, formAction, isPending] = useActionState(updatePageAction, {} as { error?: string });

  return (
    <form action={formAction} className="max-w-md space-y-4 rounded-xl border bg-card p-6">
      <input type="hidden" name="id" value={page.id} />
      <div>
        <label htmlFor="path" className="mb-1.5 block text-sm font-medium">
          Path
        </label>
        <Input
          id="path"
          name="path"
          defaultValue={page.path}
          placeholder="/dashboard/..."
          required
          disabled={isPending}
          className="font-mono text-sm"
        />
      </div>
      <div>
        <label htmlFor="label" className="mb-1.5 block text-sm font-medium">
          ชื่อหน้า
        </label>
        <Input
          id="label"
          name="label"
          defaultValue={page.label}
          required
          disabled={isPending}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Role
        </label>
        <RoleSelector name="roles" value={page.roles} roles={roles} disabled={isPending} />
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
          <Link href="/dashboard/permissions">ยกเลิก</Link>
        </Button>
      </div>
    </form>
  );
}
