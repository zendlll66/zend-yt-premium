import Link from "next/link";
import { notFound } from "next/navigation";
import { findProductById } from "@/features/product/product.repo";
import { findAllCategories } from "@/features/category/category.repo";
import { findAllKitchenCategories } from "@/features/kitchen-category/kitchen-category.repo";
import { findAllModifierGroups } from "@/features/modifier/modifier.repo";
import { getModifierGroupIdsByProductId } from "@/features/modifier/modifier.repo";
import { Button } from "@/components/ui/button";
import { ProductForm } from "../../product-form";
import { ProductModifierSection } from "../../product-modifier-section";
import { updateProductAction } from "@/features/product/product.actions";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = parseInt(id, 10);
  if (!Number.isFinite(productId)) notFound();

  const [product, categories, kitchenCategories, modifierGroups, productModifierIds] =
    await Promise.all([
      findProductById(productId),
      findAllCategories(),
      findAllKitchenCategories(),
      findAllModifierGroups(),
      getModifierGroupIdsByProductId(productId),
    ]);

  if (!product) notFound();

  const groupsForSelect = modifierGroups.map((g) => ({ id: g.id, name: g.name }));

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/products">← จัดการสินค้า</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">แก้ไขสินค้า</h1>
      <ProductForm
        categories={categories}
        kitchenCategories={kitchenCategories}
        product={{
          id: product.id,
          name: product.name,
          categoryId: product.categoryId,
          kitchenCategoryId: product.kitchenCategoryId,
          price: product.price,
          cost: product.cost,
          sku: product.sku,
          barcode: product.barcode,
          imageUrl: product.imageUrl,
          isActive: product.isActive,
        }}
        action={updateProductAction}
      />
      <ProductModifierSection
        productId={product.id}
        groups={groupsForSelect}
        selectedGroupIds={productModifierIds}
      />
    </div>
  );
}
