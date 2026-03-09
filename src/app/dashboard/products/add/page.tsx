import Link from "next/link";
import { createProductAction } from "@/features/product/product.actions";
import { findAllCategories } from "@/features/category/category.repo";
import { Button } from "@/components/ui/button";
import { ProductForm } from "../product-form";

export default async function AddProductPage() {
  const categories = await findAllCategories();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/products">← จัดการสินค้า</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">เพิ่มสินค้า/ของเช่า</h1>
      <ProductForm categories={categories} action={createProductAction} />
    </div>
  );
}
