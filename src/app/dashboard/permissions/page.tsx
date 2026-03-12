import { findAllPagesWithRoles } from "@/features/page-permission/page-permission.repo";
import { findAllRoles } from "@/features/role/role.repo";
import { getSessionUser } from "@/lib/auth-server";
import { SUPER_ADMIN_ROLE } from "@/features/admin/constants";
import { PermissionsClient } from "./permissions-client";

export default async function PermissionsPage() {
  const user = await getSessionUser();
  const isSuperAdmin = user?.role === SUPER_ADMIN_ROLE;
  let pages: Awaited<ReturnType<typeof findAllPagesWithRoles>> = [];
  let roles: Awaited<ReturnType<typeof findAllRoles>> = [];
  try {
    [pages, roles] = await Promise.all([
      findAllPagesWithRoles(),
      findAllRoles(),
    ]);
  } catch {
    pages = [];
    roles = [];
  }
  const roleOptions = roles.map((r) => ({ slug: r.slug, name: r.name }));

  return (
    <PermissionsClient
      pages={pages}
      roles={roleOptions}
      isSuperAdmin={!!isSuperAdmin}
    />
  );
}
