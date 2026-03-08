import { compare } from "bcryptjs";
import { findAdminByEmail } from "./admin.repo";

export type AdminUserSession = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "cashier";
};

export async function verifyAdminLogin(
  email: string,
  password: string
): Promise<AdminUserSession | null> {
  const user = await findAdminByEmail(email);
  if (!user) return null;
  const ok = await compare(password, user.password);
  if (!ok) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as "admin" | "cashier",
  };
}
