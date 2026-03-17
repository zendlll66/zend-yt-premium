"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { deleteModifierGroupAction } from "@/features/modifier/modifier.actions";
import { Button } from "@/components/ui/button";

export function ModifierGroupRowActions({ id }: { id: number }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("ต้องการลบกลุ่มตัวเลือกนี้ใช่หรือไม่? ตัวเลือกภายในและการผูกกับสินค้าจะถูกลบด้วย")) return;
    setDeleting(true);
    try {
      const result = await deleteModifierGroupAction(id);
      if (result?.error) alert(result.error);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/dashboard/modifiers/${id}/edit`}>แก้ไข / จัดการตัวเลือก</Link>
      </Button>
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
    </div>
  );
}
