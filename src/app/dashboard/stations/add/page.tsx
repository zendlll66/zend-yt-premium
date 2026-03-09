import Link from "next/link";
import { createKitchenCategoryAction } from "@/features/kitchen-category/kitchen-category.actions";
import { Button } from "@/components/ui/button";
import { StationForm } from "../station-form";

export default function AddStationPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/stations">← จัดการ Station</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">เพิ่ม Station</h1>
      <StationForm action={createKitchenCategoryAction} />
    </div>
  );
}
