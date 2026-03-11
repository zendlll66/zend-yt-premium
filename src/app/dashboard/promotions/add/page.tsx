import { getMenuForOrder } from "@/features/modifier/modifier.repo";
import { PromotionForm } from "../promotion-form";

export default async function AddPromotionPage() {
  const menu = await getMenuForOrder();
  const products = menu.map((p) => ({
    id: p.id,
    name: p.name,
    imageUrl: p.imageUrl ?? null,
  }));

  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="text-xl font-semibold">เพิ่มโปรลดราคา</h1>
      <PromotionForm products={products} />
    </div>
  );
}
