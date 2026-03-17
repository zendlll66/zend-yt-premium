"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { deleteCategoryAction } from "@/features/category/category.actions";
import { Button } from "@/components/ui/button";

export function CategoryRowActions({ id }: { id: number }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("ต้องการลบหมวดหมู่นี้ใช่หรือไม่? สินค้าที่ผูกอยู่จะถูกตั้งเป็นไม่ระบุหมวดหมู่")) return;
    setDeleting(true);
    try {
      const result = await deleteCategoryAction(id);
      if (result?.error) alert(result.error);
      router.refresh();
    } finally {
      setDeleting(false);
    }
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
