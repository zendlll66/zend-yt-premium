"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteKitchenCategoryAction } from "@/features/kitchen-category/kitchen-category.actions";
import { Button } from "@/components/ui/button";

export function StationRowActions({ id }: { id: number }) {
  const router = useRouter();

  async function handleDelete() {
    if (
      !confirm(
        "ต้องการลบ Station นี้ใช่หรือไม่? สินค้าที่ผูก Station นี้จะถูกตั้งเป็นไม่ระบุ Station"
      )
    )
      return;
    const result = await deleteKitchenCategoryAction(id);
    if (result?.error) alert(result.error);
    router.refresh();
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/dashboard/stations/${id}/edit`}>แก้ไข</Link>
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
