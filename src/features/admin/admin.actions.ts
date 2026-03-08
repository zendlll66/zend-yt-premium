"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import {
  createAdmin,
  findAdminByEmail,
  findAdminById,
  updateAdmin,
  deleteAdminById,
} from "./admin.repo";
import { SUPER_ADMIN_ROLE } from "./constants";

export type CreateUserState = { error?: string };

export async function createUserAction(
  _prev: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  const name = (formData.get("name") as string)?.trim() ?? "";
  const email = (formData.get("email") as string)?.trim().toLowerCase() ?? "";
  const password = (formData.get("password") as string) ?? "";
  const role = (formData.get("role") as string) ?? "cashier";

  if (!name || !email || !password) {
    return { error: "กรุณากรอกชื่อ อีเมล และรหัสผ่าน" };
  }

  if (password.length < 6) {
    return { error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" };
  }

  const validRoles = ["admin", "cashier", "chef"];
  if (!validRoles.includes(role)) {
    return { error: "บทบาทไม่ถูกต้อง" };
  }

  const existing = await findAdminByEmail(email);
  if (existing) {
    return { error: "อีเมลนี้ถูกใช้งานแล้ว" };
  }

  const passwordHash = await hash(password, 10);
  const user = await createAdmin({
    name,
    email,
    password: passwordHash,
    role: role as "admin" | "cashier" | "chef",
  });

  if (!user) {
    return { error: "สร้างผู้ใช้ไม่สำเร็จ" };
  }

  redirect("/dashboard/user-list");
}

export type UpdateUserState = { error?: string };

export async function updateUserAction(
  _prev: UpdateUserState,
  formData: FormData
): Promise<UpdateUserState> {
  const id = parseInt((formData.get("id") as string) ?? "0", 10);
  const name = (formData.get("name") as string)?.trim() ?? "";
  const email = (formData.get("email") as string)?.trim().toLowerCase() ?? "";
  const password = (formData.get("password") as string) ?? "";
  const role = (formData.get("role") as string) ?? "cashier";

  if (!id || !name || !email) {
    return { error: "กรุณากรอกชื่อ และอีเมล" };
  }

  if (password.length > 0 && password.length < 6) {
    return { error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" };
  }

  const validRoles = ["admin", "cashier", "chef"];
  if (!validRoles.includes(role)) {
    return { error: "บทบาทไม่ถูกต้อง" };
  }

  const existing = await findAdminById(id);
  if (!existing) {
    return { error: "ไม่พบผู้ใช้" };
  }

  const emailTaken = await findAdminByEmail(email);
  if (emailTaken && emailTaken.id !== id) {
    return { error: "อีเมลนี้ถูกใช้งานแล้ว" };
  }

  const payload: { name: string; email: string; role?: "admin" | "cashier" | "chef"; password?: string } = {
    name,
    email,
    role: role as "admin" | "cashier" | "chef",
  };
  if (existing.role === SUPER_ADMIN_ROLE) {
    delete payload.role;
  }
  if (password.length >= 6) {
    payload.password = await hash(password, 10);
  }

  const user = await updateAdmin(id, payload);
  if (!user) {
    return { error: "อัปเดตไม่สำเร็จ" };
  }

  revalidatePath("/dashboard/user-list");
  redirect("/dashboard/user-list");
}

export async function deleteUserAction(id: number) {
  const user = await findAdminById(id);
  if (user?.role === SUPER_ADMIN_ROLE) {
    return { error: "ไม่สามารถลบผู้ดูแลระบบหลัก (Super Admin) ได้" };
  }
  const ok = await deleteAdminById(id);
  revalidatePath("/dashboard/user-list");
  if (!ok) return { error: "ลบไม่สำเร็จ" };
  return {};
}
