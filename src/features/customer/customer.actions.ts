"use server";

import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { getCustomerSession } from "@/lib/auth-customer-server";
import {
  findCustomerById,
  updateCustomer,
  updateCustomerPassword,
  findCustomerByEmail,
} from "./customer.repo";

export async function updateProfileAction(formData: FormData): Promise<{ error?: string }> {
  const customer = await getCustomerSession();
  if (!customer) return { error: "กรุณาเข้าสู่ระบบ" };

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const phone = (formData.get("phone") as string)?.trim() || null;

  if (!name) return { error: "กรุณากรอกชื่อ" };
  if (!email) return { error: "กรุณากรอกอีเมล" };

  if (email !== customer.email) {
    const existing = await findCustomerByEmail(email);
    if (existing) return { error: "อีเมลนี้มีผู้ใช้แล้ว" };
  }

  await updateCustomer(customer.id, { name, email, phone });
  revalidatePath("/account");
  revalidatePath("/account/profile");
  revalidatePath("/rent");
  return {};
}

export async function changePasswordAction(
  currentPassword: string,
  newPassword: string
): Promise<{ error?: string }> {
  const customer = await getCustomerSession();
  if (!customer) return { error: "กรุณาเข้าสู่ระบบ" };
  if (!currentPassword || !newPassword) return { error: "กรุณากรอกรหัสผ่าน" };
  if (newPassword.length < 6) return { error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร" };

  const { findCustomerWithPassword } = await import("./customer.repo");
  const { compare } = await import("bcryptjs");
  const user = await findCustomerWithPassword(customer.id);
  if (!user) return { error: "ไม่พบผู้ใช้" };
  const ok = await compare(currentPassword, user.password);
  if (!ok) return { error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" };

  const passwordHash = await hash(newPassword, 10);
  await updateCustomerPassword(customer.id, passwordHash);
  revalidatePath("/account/profile");
  return {};
}
