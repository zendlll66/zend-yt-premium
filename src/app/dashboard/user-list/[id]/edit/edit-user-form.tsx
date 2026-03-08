"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updateUserAction } from "@/features/admin/admin.actions";
import { SUPER_ADMIN_ROLE } from "@/features/admin/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export function EditUserForm({ user }: { user: User }) {
  const [state, formAction, isPending] = useActionState(updateUserAction, {} as { error?: string });
  const isSuperAdmin = user.role === SUPER_ADMIN_ROLE;

  return (
    <form action={formAction} className="max-w-md space-y-4 rounded-xl border bg-card p-6">
      <input type="hidden" name="id" value={user.id} />
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
          ชื่อ
        </label>
        <Input
          id="name"
          name="name"
          defaultValue={user.name}
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
          defaultValue={user.email}
          placeholder="user@example.com"
          required
          disabled={isPending}
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
          รหัสผ่านใหม่
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="เว้นว่างถ้าไม่ต้องการเปลี่ยน"
          minLength={6}
          disabled={isPending}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          บทบาท
        </label>
        {isSuperAdmin ? (
          <div className="flex h-9 items-center rounded-4xl border border-input bg-muted/50 px-3 text-sm text-muted-foreground">
            Super Admin (ไม่สามารถเปลี่ยนได้)
          </div>
        ) : (
          <select
            id="role"
            name="role"
            defaultValue={user.role}
            className="h-9 w-full rounded-4xl border border-input bg-input/30 px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={isPending}
          >
            <option value="cashier">แคชเชียร์</option>
            <option value="admin">แอดมิน</option>
            <option value="chef">เชฟ</option>
          </select>
        )}
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
