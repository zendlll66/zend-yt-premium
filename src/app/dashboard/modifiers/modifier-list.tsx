"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createModifierAction,
  updateModifierAction,
  deleteModifierAction,
} from "@/features/modifier/modifier.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ModifierItem = { id: number; name: string; price: number };

export function ModifierList({
  groupId,
  modifiers: initialModifiers,
}: {
  groupId: number;
  modifiers: ModifierItem[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("groupId", String(groupId));
    const result = await createModifierAction(formData);
    setPending(false);
    if (result?.error) setError(result.error);
    else {
      form.reset();
      router.refresh();
    }
  }

  async function handleEdit(id: number, formData: FormData) {
    setError(null);
    setPending(true);
    const result = await updateModifierAction(id, groupId, formData);
    setPending(false);
    if (result?.error) setError(result.error);
    else router.refresh();
  }

  async function handleDelete(id: number) {
    if (!confirm("ลบตัวเลือกนี้?")) return;
    const result = await deleteModifierAction(id);
    if (result?.error) alert(result.error);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {initialModifiers.length === 0 ? (
        <p className="text-muted-foreground text-sm">ยังไม่มีตัวเลือก — เพิ่มด้านล่าง</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="pb-2 font-medium">ชื่อ</th>
              <th className="pb-2 font-medium">ราคาเพิ่ม (฿)</th>
              <th className="pb-2 text-right font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {initialModifiers.map((m) => (
              <ModifierRow
                key={m.id}
                modifier={m}
                onSave={(formData) => handleEdit(m.id, formData)}
                onDelete={() => handleDelete(m.id)}
                disabled={pending}
              />
            ))}
          </tbody>
        </table>
      )}

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2 border-t pt-4">
        <input type="hidden" name="groupId" value={groupId} />
        <div>
          <label htmlFor="new_name" className="mb-1 block text-xs font-medium text-muted-foreground">
            ชื่อตัวเลือกใหม่
          </label>
          <Input
            id="new_name"
            name="name"
            placeholder="เช่น Medium"
            required
            disabled={pending}
            className="w-40"
          />
        </div>
        <div>
          <label htmlFor="new_price" className="mb-1 block text-xs font-medium text-muted-foreground">
            ราคาเพิ่ม (฿)
          </label>
          <Input
            id="new_price"
            name="price"
            type="number"
            min={0}
            step={0.01}
            defaultValue={0}
            disabled={pending}
            className="w-24"
          />
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          เพิ่มตัวเลือก
        </Button>
      </form>
    </div>
  );
}

function ModifierRow({
  modifier,
  onSave,
  onDelete,
  disabled,
}: {
  modifier: ModifierItem;
  onSave: (formData: FormData) => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(modifier.name);
  const [price, setPrice] = useState(String(modifier.price));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("name", name);
    formData.set("price", price);
    onSave(formData);
    setEditing(false);
  }

  if (editing) {
    return (
      <tr className="border-b">
        <td className="py-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 w-40"
            autoFocus
          />
        </td>
        <td className="py-2">
          <Input
            type="number"
            min={0}
            step={0.01}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="h-8 w-24"
          />
        </td>
        <td className="py-2 text-right">
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
            ยกเลิก
          </Button>
          <Button type="button" size="sm" onClick={handleSubmit}>
            บันทึก
          </Button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b">
      <td className="py-2 font-medium">{modifier.name}</td>
      <td className="py-2 text-muted-foreground">
        {modifier.price > 0 ? `+${modifier.price} ฿` : "—"}
      </td>
      <td className="py-2 text-right">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setEditing(true)}
          disabled={disabled}
        >
          แก้ไข
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onDelete}
          disabled={disabled}
          className="ml-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          ลบ
        </Button>
      </td>
    </tr>
  );
}
