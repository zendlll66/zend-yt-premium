import Link from "next/link";
import { createModifierGroupAction } from "@/features/modifier/modifier.actions";
import { Button } from "@/components/ui/button";
import { ModifierGroupForm } from "../modifier-group-form";

export default function AddModifierGroupPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/modifiers">← ตัวเลือกสินค้า</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">เพิ่มกลุ่มตัวเลือก</h1>
      <ModifierGroupForm action={createModifierGroupAction} />
    </div>
  );
}
