"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteUserAction } from "@/features/admin/admin.actions";
import { SUPER_ADMIN_ROLE } from "@/features/admin/constants";
import { Button } from "@/components/ui/button";

export function UserRowActions({ id, role }: { id: number; role: string }) {
  const router = useRouter();
  const isSuperAdmin = role === SUPER_ADMIN_ROLE;

  async function handleDelete() {
    if (!confirm("ต้องการลบผู้ใช้นี้ใช่หรือไม่?")) return;
    const result = await deleteUserAction(id);
    if (result?.error) alert(result.error);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/dashboard/user-list/${id}/edit`}>แก้ไข</Link>
      </Button>
      {!isSuperAdmin && (
        <Button variant="outline" size="sm" onClick={handleDelete} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
          ลบ
        </Button>
      )}
    </div>
  );
}
