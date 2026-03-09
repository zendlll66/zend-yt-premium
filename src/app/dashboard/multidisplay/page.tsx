import { findAllKitchenCategories } from "@/features/kitchen-category/kitchen-category.repo";
import { MultidisplayView } from "./multidisplay-view";

type Props = { searchParams: Promise<{ layout?: string; p1?: string; p2?: string; p3?: string; p4?: string }> };

export default async function MultidisplayPage({ searchParams }: Props) {
  const params = await searchParams;
  const kitchenCategories = await findAllKitchenCategories();

  return (
    <div className="flex h-full flex-col">
      <MultidisplayView
        initialLayout={params.layout ?? "1"}
        initialPanels={[params.p1, params.p2, params.p3, params.p4].filter(Boolean)}
        kitchenCategories={kitchenCategories.map((k) => ({ id: k.id, name: k.name }))}
      />
    </div>
  );
}
