"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { deleteUserAction } from "@/features/admin/admin.actions";
import { SUPER_ADMIN_ROLE } from "@/features/admin/constants";
import { Button } from "@/components/ui/button";

export function UserRowActions({ id, role }: { id: number; role: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const isSuperAdmin = role === SUPER_ADMIN_ROLE;

  async function handleDelete() {
    if (!confirm("ต้องการลบผู้ใช้นี้ใช่หรือไม่?")) return;
    setDeleting(true);
    try {
      const result = await deleteUserAction(id);
      if (result?.error) alert(result.error);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/dashboard/user-list/${id}/edit`}>แก้ไข</Link>
      </Button>
      {!isSuperAdmin && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          {deleting ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin shrink-0" aria-hidden />
              กำลังลบ…
            </>
          ) : (
            "ลบ"
          )}
        </Button>
      )}
    </div>
  );
}
