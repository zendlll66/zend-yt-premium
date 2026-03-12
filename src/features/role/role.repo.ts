import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { roles } from "@/db/schema/role.schema";
import { adminUsers } from "@/db/schema/admin-user.schema";
import { pageRoles } from "@/db/schema/page-permission.schema";

export type RoleRow = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export async function findAllRoles(): Promise<RoleRow[]> {
  const rows = await db
    .select()
    .from(roles)
    .orderBy(roles.slug);
  return rows;
}

export async function findRoleById(id: number): Promise<RoleRow | null> {
  const [row] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
  return row ?? null;
}

export async function findRoleBySlug(slug: string): Promise<RoleRow | null> {
  const [row] = await db.select().from(roles).where(eq(roles.slug, slug)).limit(1);
  return row ?? null;
}

export async function countAdminsByRole(slug: string): Promise<number> {
  const [r] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(adminUsers)
    .where(eq(adminUsers.role, slug));
  return r?.count ?? 0;
}

export async function createRole(data: {
  slug: string;
  name: string;
  description?: string | null;
}): Promise<RoleRow | null> {
  const slug = data.slug.trim().toLowerCase().replace(/\s+/g, "_");
  const [row] = await db
    .insert(roles)
    .values({
      slug,
      name: data.name.trim(),
      description: data.description?.trim() || null,
    })
    .returning();
  return row ?? null;
}

export async function updateRole(
  id: number,
  data: { slug?: string; name?: string; description?: string | null }
): Promise<RoleRow | null> {
  if (data.slug != null) {
    const slug = data.slug.trim().toLowerCase().replace(/\s+/g, "_");
    const existing = await findRoleBySlug(slug);
    if (existing && existing.id !== id) return null; // slug ซ้ำ
  }
  const payload: Record<string, unknown> = {};
  if (data.slug != null) payload.slug = data.slug.trim().toLowerCase().replace(/\s+/g, "_");
  if (data.name != null) payload.name = data.name.trim();
  if (data.description !== undefined) payload.description = data.description?.trim() || null;
  if (Object.keys(payload).length === 0) return findRoleById(id);
  const [row] = await db
    .update(roles)
    .set(payload as Partial<typeof roles.$inferInsert>)
    .where(eq(roles.id, id))
    .returning();
  return row ?? null;
}

const SYSTEM_ROLE_SLUGS = ["super_admin"];

export async function deleteRole(id: number): Promise<{ ok: boolean; error?: string }> {
  const role = await findRoleById(id);
  if (!role) return { ok: false, error: "ไม่พบบทบาทนี้" };
  if (SYSTEM_ROLE_SLUGS.includes(role.slug)) {
    return { ok: false, error: "ไม่สามารถลบบทบาทระบบนี้ได้" };
  }
  const count = await countAdminsByRole(role.slug);
  if (count > 0) {
    return { ok: false, error: `มีผู้ใช้ในบทบาทนี้ ${count} คน ไม่สามารถลบได้` };
  }
  await db.delete(pageRoles).where(eq(pageRoles.role, role.slug));
  await db.delete(roles).where(eq(roles.id, id));
  return { ok: true };
}
