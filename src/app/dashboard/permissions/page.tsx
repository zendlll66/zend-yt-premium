import { findAllPagesWithRoles } from "@/features/page-permission/page-permission.repo";
import { getSessionUser } from "@/lib/auth-server";
import { SUPER_ADMIN_ROLE } from "@/features/admin/constants";
import { PermissionsClient } from "./permissions-client";

export default async function PermissionsPage() {
  const user = await getSessionUser();
  const isSuperAdmin = user?.role === SUPER_ADMIN_ROLE;
  let pages: Awaited<ReturnType<typeof findAllPagesWithRoles>> = [];
  try {
    pages = await findAllPagesWithRoles();
  } catch {
    pages = [];
  }

  return (
    <PermissionsClient pages={pages} isSuperAdmin={!!isSuperAdmin} />
  );
}
