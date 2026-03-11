import { notFound } from "next/navigation";
import { findPromotionById } from "@/features/promotion/promotion.repo";
import { getMenuForOrder } from "@/features/modifier/modifier.repo";
import { PromotionForm } from "../../promotion-form";

export default async function EditPromotionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const promotionId = parseInt(id, 10);
  if (!Number.isFinite(promotionId)) notFound();
  const [promotion, menu] = await Promise.all([
    findPromotionById(promotionId),
    getMenuForOrder(),
  ]);
  if (!promotion) notFound();
  const products = menu.map((p) => ({
    id: p.id,
    name: p.name,
    imageUrl: p.imageUrl ?? null,
  }));

  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="text-xl font-semibold">แก้ไขโปร: {promotion.name}</h1>
      <PromotionForm promotion={promotion} products={products} />
    </div>
  );
}
