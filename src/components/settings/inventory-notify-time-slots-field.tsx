"use client";

import { useCallback, useState } from "react";
import { Clock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseTimeList } from "@/lib/inventory-notify-schedule";
import { cn } from "@/lib/utils";

function timesToSlotValues(raw: string): string[] {
  const parsed = parseTimeList(raw);
  if (parsed.length === 0) return ["09:00"];
  return parsed.map(
    ({ h, m }) => `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
  );
}

function joinSlotValues(slots: string[]): string {
  return slots
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");
}

function newRowId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

type Row = { id: string; value: string };

type Props = {
  name: string;
  defaultValue: string;
  disabled?: boolean;
  /** ผูกกับ &lt;label htmlFor&gt; ของแถวแรก */
  firstInputId?: string;
};

/**
 * รายการเวลาแจ้งเตือน — ใช้ native time picker + เพิ่ม/ลบรอบ (ส่งค่าเป็น comma-separated HH:mm)
 */
export function InventoryNotifyTimeSlotsField({
  name,
  defaultValue,
  disabled,
  firstInputId,
}: Props) {
  const [rows, setRows] = useState<Row[]>(() =>
    timesToSlotValues(defaultValue).map((value) => ({ id: newRowId(), value }))
  );

  const updateSlot = useCallback((id: string, value: string) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, value } : row)));
  }, []);

  const addSlot = useCallback(() => {
    setRows((prev) => [...prev, { id: newRowId(), value: "12:00" }]);
  }, []);

  const removeSlot = useCallback((id: string) => {
    setRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((row) => row.id !== id);
    });
  }, []);

  const joined = joinSlotValues(rows.map((r) => r.value));

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={joined} />
      <div className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <div key={row.id} className="flex max-w-md items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Clock
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                id={i === 0 ? firstInputId : undefined}
                type="time"
                step={300}
                value={row.value}
                onChange={(e) => updateSlot(row.id, e.target.value)}
                disabled={disabled}
                className={cn(
                  "h-9 w-full min-w-0 rounded-4xl border border-input bg-input/30 py-1 pl-10 pr-3 text-sm transition-colors outline-none",
                  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
                  "scheme-dark"
                )}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0 rounded-4xl"
              onClick={() => removeSlot(row.id)}
              disabled={disabled || rows.length <= 1}
              aria-label="ลบรอบนี้"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-4xl gap-1.5"
        onClick={addSlot}
        disabled={disabled}
      >
        <Plus className="size-4" />
        เพิ่มรอบ
      </Button>
    </div>
  );
}
