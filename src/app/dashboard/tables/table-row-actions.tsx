"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteTableAction } from "@/features/table/table.actions";
import { Button } from "@/components/ui/button";

export function TableRowActions({ id }: { id: number }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("ต้องการลบโต๊ะนี้ใช่หรือไม่?")) return;
    const result = await deleteTableAction(id);
    if (result?.error) alert(result.error);
    router.refresh();
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/dashboard/tables/${id}/edit`}>แก้ไข</Link>
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
