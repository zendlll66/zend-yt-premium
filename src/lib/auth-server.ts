import { cookies } from "next/headers";
import { createHmac } from "node:crypto";
import { findAdminById } from "@/features/admin/admin.repo";
import { COOKIE_NAME, SECRET } from "./auth-session";

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "cashier" | "chef" | "super_admin";
};

/** Verify session cookie (Node only - same algorithm as middleware) */
function verifySessionCookie(value: string): number | null {
  const parts = value.split(".");
  if (parts.length !== 2) return null;
  const [idStr, sigHex] = parts;
  if (!idStr || !sigHex) return null;
  const expected = createHmac("sha256", SECRET).update(idStr).digest("hex");
  if (expected !== sigHex) return null;
  const id = parseInt(idStr, 10);
  return Number.isFinite(id) ? id : null;
}

/** ดึงข้อมูล admin ปัจจุบันจาก session (ใช้ใน Server Component / Server Action) */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  if (!value) return null;
  const userId = verifySessionCookie(value);
  if (!userId) return null;
  const user = await findAdminById(userId);
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as SessionUser["role"],
  };
}
