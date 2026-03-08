import Link from "next/link";
import { createTableAction } from "@/features/table/table.actions";
import { Button } from "@/components/ui/button";
import { TableForm } from "../table-form";

export default function AddTablePage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/tables">← จัดการโต๊ะ</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">เพิ่มโต๊ะ</h1>
      <TableForm action={createTableAction} />
    </div>
  );
}
