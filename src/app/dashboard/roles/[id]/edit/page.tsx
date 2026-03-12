import { notFound } from "next/navigation";
import Link from "next/link";
import { findRoleById } from "@/features/role/role.repo";
import { Button } from "@/components/ui/button";
import { RoleForm } from "../../role-form";

type Props = { params: Promise<{ id: string }> };

export default async function EditRolePage({ params }: Props) {
  const { id } = await params;
  const roleId = parseInt(id, 10);
  if (!Number.isFinite(roleId)) notFound();

  const role = await findRoleById(roleId);
  if (!role) notFound();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/roles">← จัดการบทบาท</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">แก้ไขบทบาท</h1>
      <RoleForm role={role} />
    </div>
  );
}
