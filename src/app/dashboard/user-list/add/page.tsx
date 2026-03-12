import Link from "next/link";
import { findAllRoles } from "@/features/role/role.repo";
import { Button } from "@/components/ui/button";
import { AddUserForm } from "./add-user-form";

export default async function AddUserPage() {
  let roles: Awaited<ReturnType<typeof findAllRoles>> = [];
  try {
    roles = await findAllRoles();
  } catch {
    roles = [];
  }
  const roleOptions = roles.map((r) => ({ slug: r.slug, name: r.name }));

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/user-list">← รายการผู้ใช้</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">เพิ่มผู้ใช้</h1>
      <AddUserForm roles={roleOptions} />
    </div>
  );
}
