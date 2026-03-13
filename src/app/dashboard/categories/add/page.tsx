import Link from "next/link";
import { createCategoryAction } from "@/features/category/category.actions";
import { Button } from "@/components/ui/button";
import { CategoryForm } from "../category-form";

export default function AddCategoryPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/categories">← หมวดหมู่สินค้า</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">เพิ่มหมวดหมู่</h1>
      <CategoryForm action={createCategoryAction} />
    </div>
  );
}
