"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createUserAction } from "@/features/admin/admin.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type RoleOption = { slug: string; name: string };

export function AddUserForm({ roles }: { roles: RoleOption[] }) {
  const [state, formAction, isPending] = useActionState(createUserAction, {} as { error?: string });
  const roleOptions = roles.filter((r) => r.slug !== "super_admin");

  return (
    <form action={formAction} className="max-w-md space-y-4 rounded-xl border bg-card p-6">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
          ชื่อ
        </label>
        <Input
          id="name"
          name="name"
          placeholder="ชื่อ-นามสกุล"
          required
          disabled={isPending}
        />
      </div>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
          อีเมล
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="user@example.com"
          required
          disabled={isPending}
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
          รหัสผ่าน
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="อย่างน้อย 6 ตัวอักษร"
          required
          minLength={6}
          disabled={isPending}
        />
      </div>
      <div>
        <label htmlFor="role" className="mb-1.5 block text-sm font-medium">
          บทบาท
        </label>
        <select
          id="role"
          name="role"
          className="h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={isPending}
          required
        >
          {roleOptions.length === 0 ? (
            <option value="cashier">แคชเชียร์</option>
          ) : (
            roleOptions.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.name}
              </option>
            ))
          )}
        </select>
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
          <Link href="/dashboard/user-list">ยกเลิก</Link>
        </Button>
      </div>
    </form>
  );
}
