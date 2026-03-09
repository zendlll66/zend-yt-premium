import Link from "next/link";
import { notFound } from "next/navigation";
import { findKitchenCategoryById } from "@/features/kitchen-category/kitchen-category.repo";
import { updateKitchenCategoryAction } from "@/features/kitchen-category/kitchen-category.actions";
import { Button } from "@/components/ui/button";
import { StationForm } from "../../station-form";

export default async function EditStationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const stationId = parseInt(id, 10);
  if (!Number.isFinite(stationId)) notFound();

  const station = await findKitchenCategoryById(stationId);
  if (!station) notFound();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/stations">← จัดการ Station</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">แก้ไข Station</h1>
      <StationForm
        station={{ id: station.id, name: station.name }}
        action={updateKitchenCategoryAction}
      />
    </div>
  );
}
