import { notFound } from "next/navigation";
import Link from "next/link";
import { findAdminById } from "@/features/admin/admin.repo";
import { Button } from "@/components/ui/button";
import { EditUserForm } from "./edit-user-form";

type Props = { params: Promise<{ id: string }> };

export default async function EditUserPage({ params }: Props) {
  const { id } = await params;
  const userId = parseInt(id, 10);
  if (!Number.isFinite(userId)) notFound();

  const user = await findAdminById(userId);
  if (!user) notFound();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/user-list">← รายการผู้ใช้</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">แก้ไขผู้ใช้</h1>

      <EditUserForm user={user} />
    </div>
  );
}
