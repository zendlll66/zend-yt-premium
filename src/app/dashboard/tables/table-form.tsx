"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CreateTableState, UpdateTableState } from "@/features/table/table.actions";
import type { createTableAction, updateTableAction } from "@/features/table/table.actions";

type Props = {
  table?: { id: number; tableNumber: string; status: string; capacity: number } | null;
  action: typeof createTableAction | typeof updateTableAction;
};

const STATUS_OPTIONS = [
  { value: "available", label: "ว่าง" },
  { value: "occupied", label: "มีลูกค้า" },
  { value: "reserved", label: "จอง" },
  { value: "cleaning", label: "กำลังทำความสะอาด" },
];

export function TableForm({ table, action }: Props) {
  const isEdit = !!table;
  const [state, formAction, isPending] = useActionState(
    action,
    {} as CreateTableState & UpdateTableState
  );

  return (
    <form action={formAction} className="max-w-md space-y-4 rounded-xl border bg-card p-6">
      {isEdit && <input type="hidden" name="id" value={table.id} />}

      <div>
        <label htmlFor="table_number" className="mb-1.5 block text-sm font-medium">
          เลขโต๊ะ *
        </label>
        <Input
          id="table_number"
          name="table_number"
          defaultValue={table?.tableNumber}
          placeholder="1"
          required
          disabled={isPending}
        />
      </div>

      {isEdit && (
        <div>
          <label htmlFor="status" className="mb-1.5 block text-sm font-medium">
            สถานะ
          </label>
          <select
            id="status"
            name="status"
            defaultValue={table?.status}
            className="h-9 w-full rounded-4xl border border-input bg-input/30 px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={isPending}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="capacity" className="mb-1.5 block text-sm font-medium">
          ความจุ (ที่นั่ง)
        </label>
        <Input
          id="capacity"
          name="capacity"
          type="number"
          min={1}
          defaultValue={table?.capacity ?? 4}
          disabled={isPending}
        />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "กำลังบันทึก…" : "บันทึก"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard/tables">ยกเลิก</Link>
        </Button>
      </div>
    </form>
  );
}
