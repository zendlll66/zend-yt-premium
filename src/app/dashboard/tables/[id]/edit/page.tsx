import Link from "next/link";
import { notFound } from "next/navigation";
import { findTableById } from "@/features/table/table.repo";
import { Button } from "@/components/ui/button";
import { TableForm } from "../../table-form";
import { updateTableAction } from "@/features/table/table.actions";

export default async function EditTablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tableId = parseInt(id, 10);
  if (!Number.isFinite(tableId)) notFound();

  const table = await findTableById(tableId);
  if (!table) notFound();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/tables">← จัดการโต๊ะ</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">แก้ไขโต๊ะ</h1>
      <TableForm
        table={{
          id: table.id,
          tableNumber: table.tableNumber,
          status: table.status,
          capacity: table.capacity,
        }}
        action={updateTableAction}
      />
    </div>
  );
}
