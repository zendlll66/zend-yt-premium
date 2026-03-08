"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteModifierGroupAction } from "@/features/modifier/modifier.actions";
import { Button } from "@/components/ui/button";

export function ModifierGroupRowActions({ id }: { id: number }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("ต้องการลบกลุ่มตัวเลือกนี้ใช่หรือไม่? ตัวเลือกภายในและการผูกกับสินค้าจะถูกลบด้วย")) return;
    const result = await deleteModifierGroupAction(id);
    if (result?.error) alert(result.error);
    router.refresh();
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
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        ลบ
      </Button>
    </div>
  );
}
