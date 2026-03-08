"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createPageAction, deletePageAction } from "@/features/page-permission/page-permission.actions";
import { ROLE_LABELS, type Role } from "@/config/permissions";
import { RoleSelector } from "@/components/role-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PageWithRoles } from "@/features/page-permission/page-permission.repo";

const ROLES: Role[] = ["super_admin", "admin", "cashier", "chef"];

export function PermissionsClient({
  pages,
  isSuperAdmin,
}: {
  pages: PageWithRoles[];
  isSuperAdmin: boolean;
}) {
  const [createState, createFormAction, createPending] = useActionState(
    createPageAction,
    {} as { error?: string }
  );

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-xl font-semibold">สิทธิ์การเข้าถึงหน้า</h1>
      <p className="text-muted-foreground text-sm">
        ตารางด้านล่างแสดงว่าหน้าไหน role ไหนเข้าได้บ้าง
        {isSuperAdmin && " (เฉพาะ Super Admin แก้ไขได้)" }
      </p>

      {isSuperAdmin && (
        <form
          action={createFormAction}
          className="flex flex-wrap items-end gap-4 rounded-xl border bg-card p-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">Path</label>
            <Input
              name="path"
              placeholder="/dashboard/..."
              required
              disabled={createPending}
              className="w-48 font-mono text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">ชื่อหน้า</label>
            <Input
              name="label"
              placeholder="ชื่อแสดง"
              required
              disabled={createPending}
              className="w-40"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Role</label>
            <RoleSelector disabled={createPending} />
          </div>
          <Button type="submit" disabled={createPending}>
            {createPending ? "กำลังเพิ่ม…" : "เพิ่มหน้า"}
          </Button>
          {createState?.error && (
            <p className="text-sm text-destructive">{createState.error}</p>
          )}
        </form>
      )}

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 font-medium">หน้า</th>
                <th className="px-4 py-3 font-medium">Path</th>
                <th className="px-4 py-3 font-medium">Role ที่เข้าได้</th>
                {isSuperAdmin && (
                  <th className="px-4 py-3 font-medium text-right">จัดการ</th>
                )}
              </tr>
            </thead>
            <tbody>
              {pages.length === 0 ? (
                <tr>
                  <td
                    colSpan={isSuperAdmin ? 4 : 3}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    ยังไม่มีรายการ (ใช้ค่าจาก config หรือเพิ่มหน้ารายการ)
                  </td>
                </tr>
              ) : (
                pages.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{p.label}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {p.path}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.roles.map((r) => (
                          <span
                            key={r}
                            className="inline-flex rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary"
                          >
                            {ROLE_LABELS[r as Role] ?? r}
                          </span>
                        ))}
                      </div>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/permissions/${p.id}/edit`}>
                              แก้ไข
                            </Link>
                          </Button>
                          <DeleteButton pageId={p.id} label={p.label} />
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DeleteButton({ pageId, label }: { pageId: number; label: string }) {
  async function handleDelete() {
    if (!confirm(`ลบหน้า "${label}" ใช่หรือไม่?`)) return;
    const result = await deletePageAction(pageId);
    if (result?.error) alert(result.error);
    window.location.reload();
  }
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDelete}
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      ลบ
    </Button>
  );
}
