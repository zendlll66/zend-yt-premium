"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteCategoryAction } from "@/features/category/category.actions";
import { Button } from "@/components/ui/button";

export function CategoryRowActions({ id }: { id: number }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("ต้องการลบหมวดหมู่นี้ใช่หรือไม่? สินค้าที่ผูกอยู่จะถูกตั้งเป็นไม่ระบุหมวดหมู่")) return;
    const result = await deleteCategoryAction(id);
    if (result?.error) alert(result.error);
    router.refresh();
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/dashboard/categories/${id}/edit`}>แก้ไข</Link>
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
