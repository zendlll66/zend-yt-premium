import Link from "next/link";
import { findAllKitchenCategories } from "@/features/kitchen-category/kitchen-category.repo";
import { Button } from "@/components/ui/button";
import { StationRowActions } from "./station-row-actions";

export default async function StationsPage() {
  const list = await findAllKitchenCategories();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">จัดการ Station</h1>
        <Button asChild>
          <Link href="/dashboard/stations/add">เพิ่ม Station</Link>
        </Button>
      </div>

      <p className="text-muted-foreground text-sm">
        Station ใช้กรองรายการใน Kitchen Display ตามประเภทครัว (เช่น Grill, Bar)
      </p>

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 font-medium">ชื่อ Station</th>
                <th className="px-4 py-3 text-right font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">
                    ยังไม่มี Station
                  </td>
                </tr>
              ) : (
                list.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-right">
                      <StationRowActions id={s.id} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
