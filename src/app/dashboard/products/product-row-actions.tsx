"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

  async function handleDelete() {
    if (!confirm("ต้องการลบสินค้านี้ใช่หรือไม่?")) return;
    const result = await deleteProductAction(id);
    if (result?.error) alert(result.error);
    router.refresh();
  }

  async function handleToggle() {
    const result = await toggleProductActiveAction(id, !isActive);
    if (result?.error) alert(result.error);
    router.refresh();
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
        title={isActive ? "ปิดการให้เช่า" : "เปิดการให้เช่า"}
      >
        {isActive ? "ปิด" : "เปิดให้เช่า"}
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
