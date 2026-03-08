import Link from "next/link";
import { findAllTables } from "@/features/table/table.repo";
import { Button } from "@/components/ui/button";
import { TableRowActions } from "./table-row-actions";
import { TableQrCell } from "./table-qr-cell";

const STATUS_LABELS: Record<string, string> = {
  available: "ว่าง",
  occupied: "มีลูกค้า",
  reserved: "จอง",
  cleaning: "กำลังทำความสะอาด",
};

export default async function TablesPage() {
  const list = await findAllTables();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">จัดการโต๊ะ</h1>
        <Button asChild>
          <Link href="/dashboard/tables/add">เพิ่มโต๊ะ</Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 font-medium">เลขโต๊ะ</th>
                <th className="px-4 py-3 font-medium">สถานะ</th>
                <th className="px-4 py-3 font-medium">ความจุ</th>
                <th className="px-4 py-3 font-medium">QR</th>
                <th className="px-4 py-3 text-right font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    ยังไม่มีโต๊ะ
                  </td>
                </tr>
              ) : (
                list.map((t) => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{t.tableNumber}</td>
                    <td className="px-4 py-3">{STATUS_LABELS[t.status] ?? t.status}</td>
                    <td className="px-4 py-3">{t.capacity} ที่นั่ง</td>
                    <td className="px-4 py-3">
                      <TableQrCell tableId={t.id} tableNumber={t.tableNumber} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <TableRowActions id={t.id} />
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
