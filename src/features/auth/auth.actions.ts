"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyAdminLogin } from "@/features/admin/admin.service";
import { COOKIE_NAME, signSessionCookie } from "@/lib/auth-session";
import { createAuditLog } from "@/features/audit/audit.repo";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = (formData.get("email") as string)?.trim() ?? "";
  const password = (formData.get("password") as string) ?? "";
  const from = (formData.get("from") as string) || "/dashboard";

  if (!email || !password) {
    return { error: "กรุณากรอกอีเมลและรหัสผ่าน" };
  }

  const user = await verifyAdminLogin(email, password);
  if (!user) {
    return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  }

  const value = signSessionCookie(user.id);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  await createAuditLog({ adminUserId: user.id, action: "auth.login", entityType: "admin_user", entityId: String(user.id), details: `เข้าสู่ระบบ: ${email}` });

  redirect(from);
}
