import { notFound } from "next/navigation";
import { findPageById } from "@/features/page-permission/page-permission.repo";
import { getSessionUser } from "@/lib/auth-server";
import { SUPER_ADMIN_ROLE } from "@/features/admin/constants";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EditPageForm } from "./edit-page-form";

type Props = { params: Promise<{ id: string }> };

export default async function EditPermissionPage({ params }: Props) {
  const user = await getSessionUser();
  if (user?.role !== SUPER_ADMIN_ROLE) {
    redirect("/dashboard/permissions");
  }
  const { id } = await params;
  const pageId = parseInt(id, 10);
  if (!Number.isFinite(pageId)) notFound();
  const page = await findPageById(pageId);
  if (!page) notFound();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/permissions">← กลับรายการสิทธิ์</Link>
      </Button>
      <h1 className="text-xl font-semibold">แก้ไขสิทธิ์หน้า</h1>
      <EditPageForm page={page} />
    </div>
  );
}
