"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveProductModifiersAction } from "@/features/modifier/modifier.actions";
import { Button } from "@/components/ui/button";

type Props = {
  productId: number;
  groups: { id: number; name: string }[];
  selectedGroupIds: number[];
};

export function ProductModifierSection({
  productId,
  groups,
  selectedGroupIds: initialSelected,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<number[]>(initialSelected);
  const [saving, setSaving] = useState(false);

  function toggle(id: number) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSave() {
    setSaving(true);
    await saveProductModifiersAction(productId, selected);
    setSaving(false);
    router.refresh();
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-2 text-sm font-medium">ตัวเลือก (Modifiers)</h2>
        <p className="text-muted-foreground text-sm">
          ยังไม่มีกลุ่มตัวเลือก — สร้างได้ที่{" "}
          <a href="/dashboard/modifiers" className="text-primary underline">
            ตัวเลือกสินค้า
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <h2 className="mb-2 text-sm font-medium">ตัวเลือกที่ใช้กับสินค้านี้</h2>
      <p className="mb-4 text-muted-foreground text-sm">
        เลือกกลุ่มตัวเลือกที่ลูกค้าสามารถเลือกเมื่อสั่งสินค้านี้ (เช่น Size, นม)
      </p>
      <ul className="space-y-2">
        {groups.map((g) => (
          <li key={g.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`mod_${g.id}`}
              checked={selected.includes(g.id)}
              onChange={() => toggle(g.id)}
              className="h-4 w-4 rounded border-input"
            />
            <label htmlFor={`mod_${g.id}`} className="text-sm">
              {g.name}
            </label>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        size="sm"
        className="mt-4"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "กำลังบันทึก…" : "บันทึกตัวเลือก"}
      </Button>
    </div>
  );
}
