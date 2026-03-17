"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  deleteProductAction,
  toggleProductActiveAction,
} from "@/features/product/product.actions";
import { Button } from "@/components/ui/button";

export function ProductRowActions({
  id,
  isActive,
  imageUrl,
}: {
  id: number;
  isActive: boolean;
  imageUrl: string | null;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  async function handleDelete() {
    if (!confirm("ต้องการลบสินค้านี้ใช่หรือไม่?")) return;
    setDeleting(true);
    try {
      const result = await deleteProductAction(id);
      if (result?.error) alert(result.error);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggle() {
    setToggling(true);
    try {
      const result = await toggleProductActiveAction(id, !isActive);
      if (result?.error) alert(result.error);
      router.refresh();
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/dashboard/products/${id}/edit`}>แก้ไข</Link>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggle}
        disabled={toggling}
        title={isActive ? "ปิดการให้เช่า" : "เปิดการให้เช่า"}
      >
        {toggling ? (
          <>
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin shrink-0" aria-hidden />
            กำลังอัปเดต…
          </>
        ) : (
          isActive ? "ปิด" : "เปิดให้เช่า"
        )}
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
