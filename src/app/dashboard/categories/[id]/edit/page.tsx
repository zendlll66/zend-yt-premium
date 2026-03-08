import Link from "next/link";
import { notFound } from "next/navigation";
import { findCategoryById } from "@/features/category/category.repo";
import { Button } from "@/components/ui/button";
import { CategoryForm } from "../../category-form";
import { updateCategoryAction } from "@/features/category/category.actions";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const categoryId = parseInt(id, 10);
  if (!Number.isFinite(categoryId)) notFound();

  const category = await findCategoryById(categoryId);
  if (!category) notFound();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/categories">← หมวดหมู่สินค้า</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">แก้ไขหมวดหมู่</h1>
      <CategoryForm
        category={{ id: category.id, name: category.name }}
        action={updateCategoryAction}
      />
    </div>
  );
}
