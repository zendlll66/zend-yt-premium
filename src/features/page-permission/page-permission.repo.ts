import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pages, pageRoles } from "@/db/schema/page-permission.schema";

export type PageWithRoles = {
  id: number;
  path: string;
  label: string;
  roles: string[];
  createdAt: Date | null;
  updatedAt: Date | null;
};

export async function findAllPagesWithRoles(): Promise<PageWithRoles[]> {
  const allPages = await db.select().from(pages).orderBy(pages.path);
  const allRoles = await db.select().from(pageRoles);
  const rolesByPageId = new Map<number, string[]>();
  for (const r of allRoles) {
    const arr = rolesByPageId.get(r.pageId) ?? [];
    arr.push(r.role);
    rolesByPageId.set(r.pageId, arr);
  }
  return allPages.map((p) => ({
    id: p.id,
    path: p.path,
    label: p.label,
    roles: rolesByPageId.get(p.id) ?? [],
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));
}

/** สำหรับ PermissionGuard: ดึง path + roles ทั้งหมด เรียง path ยาวมาก่อน */
export async function getPermissionsForGuard(): Promise<{ path: string; roles: string[] }[]> {
  const list = await findAllPagesWithRoles();
  return list
    .map((p) => ({ path: p.path, roles: p.roles }))
    .sort((a, b) => b.path.length - a.path.length);
}

export async function findPageById(id: number) {
  const [page] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  if (!page) return null;
  const roles = await db
    .select({ role: pageRoles.role })
    .from(pageRoles)
    .where(eq(pageRoles.pageId, id));
  return {
    ...page,
    roles: roles.map((r) => r.role),
  };
}

export async function findPageByPath(path: string) {
  const [page] = await db.select().from(pages).where(eq(pages.path, path)).limit(1);
  return page ?? null;
}

export async function createPage(data: { path: string; label: string; roles: string[] }) {
  const [page] = await db
    .insert(pages)
    .values({ path: data.path, label: data.label })
    .returning();
  if (!page) return null;
  if (data.roles.length > 0) {
    type Role = "admin" | "cashier" | "chef" | "super_admin";
    await db.insert(pageRoles).values(
      data.roles.map((role) => ({ pageId: page.id, role: role as Role }))
    );
  }
  return page.id;
}

export async function updatePage(
  id: number,
  data: { path?: string; label?: string; roles?: string[] }
) {
  const payload: { path?: string; label?: string; updatedAt?: Date } = {};
  if (data.path != null) payload.path = data.path;
  if (data.label != null) payload.label = data.label;
  if (Object.keys(payload).length > 0) {
    payload.updatedAt = new Date();
    await db.update(pages).set(payload).where(eq(pages.id, id));
  }
  if (data.roles != null) {
    type Role = "admin" | "cashier" | "chef" | "super_admin";
    await db.delete(pageRoles).where(eq(pageRoles.pageId, id));
    if (data.roles.length > 0) {
      await db.insert(pageRoles).values(
        data.roles.map((role) => ({ pageId: id, role: role as Role }))
      );
    }
  }
  return true;
}

export async function deletePage(id: number) {
  await db.delete(pageRoles).where(eq(pageRoles.pageId, id));
  await db.delete(pages).where(eq(pages.id, id));
  return true;
}
