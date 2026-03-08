import Link from "next/link";
import { notFound } from "next/navigation";
import { findModifierGroupWithModifiers } from "@/features/modifier/modifier.repo";
import { Button } from "@/components/ui/button";
import { ModifierGroupForm } from "../../modifier-group-form";
import { updateModifierGroupAction } from "@/features/modifier/modifier.actions";
import { ModifierList } from "../../modifier-list";

export default async function EditModifierGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const groupId = parseInt(id, 10);
  if (!Number.isFinite(groupId)) notFound();

  const group = await findModifierGroupWithModifiers(groupId);
  if (!group) notFound();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/modifiers">← ตัวเลือกสินค้า</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">แก้ไขกลุ่ม: {group.name}</h1>

      <ModifierGroupForm
        group={{ id: group.id, name: group.name, required: group.required }}
        action={updateModifierGroupAction}
      />

      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-sm font-medium">ตัวเลือกในกลุ่มนี้</h2>
        <ModifierList groupId={group.id} modifiers={group.modifiers} />
      </div>
    </div>
  );
}
