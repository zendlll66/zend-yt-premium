"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth-server";
import { SUPER_ADMIN_ROLE } from "@/features/admin/constants";
import {
  createPage,
  updatePage,
  deletePage,
  findPageByPath,
  findPageById,
} from "./page-permission.repo";

function assertSuperAdmin() {
  return getSessionUser().then((user) => {
    if (!user || user.role !== SUPER_ADMIN_ROLE) {
      throw new Error("เฉพาะ Super Admin เท่านั้นที่จัดการสิทธิ์ได้");
    }
    return user;
  });
}

export type PagePermissionFormState = { error?: string };

export async function createPageAction(
  _prev: PagePermissionFormState,
  formData: FormData
): Promise<PagePermissionFormState> {
  try {
    await assertSuperAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "ไม่มีสิทธิ์" };
  }
  const path = (formData.get("path") as string)?.trim() ?? "";
  const label = (formData.get("label") as string)?.trim() ?? "";
  const rolesStr = (formData.get("roles") as string) ?? "";
  const roles = rolesStr ? rolesStr.split(",").map((r) => r.trim()).filter(Boolean) : [];

  if (!path || !label) {
    return { error: "กรุณากรอก path และ label" };
  }
  if (!path.startsWith("/")) {
    return { error: "path ต้องขึ้นต้นด้วย /" };
  }
  const existing = await findPageByPath(path);
  if (existing) {
    return { error: "path นี้มีอยู่แล้ว" };
  }

  const validRoles = ["super_admin", "admin", "cashier", "chef"];
  const invalid = roles.filter((r) => !validRoles.includes(r));
  if (invalid.length > 0) {
    return { error: "บทบาทไม่ถูกต้อง: " + invalid.join(", ") };
  }

  await createPage({ path, label, roles });
  revalidatePath("/dashboard/permissions");
  return {};
}

export async function updatePageAction(
  _prev: PagePermissionFormState,
  formData: FormData
): Promise<PagePermissionFormState> {
  try {
    await assertSuperAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "ไม่มีสิทธิ์" };
  }
  const id = parseInt((formData.get("id") as string) ?? "0", 10);
  const path = (formData.get("path") as string)?.trim() ?? "";
  const label = (formData.get("label") as string)?.trim() ?? "";
  const rolesStr = (formData.get("roles") as string) ?? "";
  const roles = rolesStr ? rolesStr.split(",").map((r) => r.trim()).filter(Boolean) : [];

  if (!id || !path || !label) {
    return { error: "กรุณากรอก path และ label" };
  }
  const page = await findPageById(id);
  if (!page) {
    return { error: "ไม่พบหน้า" };
  }
  const validRoles = ["super_admin", "admin", "cashier", "chef"];
  const invalid = roles.filter((r) => !validRoles.includes(r));
  if (invalid.length > 0) {
    return { error: "บทบาทไม่ถูกต้อง: " + invalid.join(", ") };
  }

  const other = await findPageByPath(path);
  if (other && other.id !== id) {
    return { error: "path นี้ถูกใช้โดยหน้าอื่นแล้ว" };
  }

  await updatePage(id, { path, label, roles });
  revalidatePath("/dashboard/permissions");
  return {};
}

export async function deletePageAction(id: number): Promise<PagePermissionFormState> {
  try {
    await assertSuperAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "ไม่มีสิทธิ์" };
  }
  const page = await findPageById(id);
  if (!page) {
    return { error: "ไม่พบหน้า" };
  }
  await deletePage(id);
  revalidatePath("/dashboard/permissions");
  return {};
}
