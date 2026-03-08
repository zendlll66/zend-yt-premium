import Link from "next/link";
import { notFound } from "next/navigation";
import { findProductById } from "@/features/product/product.repo";
import { findAllCategories } from "@/features/category/category.repo";
import { Button } from "@/components/ui/button";
import { ProductForm } from "../../product-form";
import { updateProductAction } from "@/features/product/product.actions";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = parseInt(id, 10);
  if (!Number.isFinite(productId)) notFound();

  const [product, categories] = await Promise.all([
    findProductById(productId),
    findAllCategories(),
  ]);

  if (!product) notFound();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/products">← จัดการสินค้า</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">แก้ไขสินค้า</h1>
      <ProductForm
        categories={categories}
        product={{
          id: product.id,
          name: product.name,
          categoryId: product.categoryId,
          price: product.price,
          cost: product.cost,
          sku: product.sku,
          barcode: product.barcode,
          imageUrl: product.imageUrl,
          isActive: product.isActive,
        }}
        action={updateProductAction}
      />
    </div>
  );
}
