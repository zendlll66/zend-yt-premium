import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { adminUsers } from "@/db/schema/admin-user.schema";

export type AdminUserListItem = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export async function findAdminByEmail(email: string) {
  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);
  return user ?? null;
}

export async function findAdminById(id: number) {
  const [user] = await db
    .select({
      id: adminUsers.id,
      name: adminUsers.name,
      email: adminUsers.email,
      role: adminUsers.role,
      createdAt: adminUsers.createdAt,
      updatedAt: adminUsers.updatedAt,
    })
    .from(adminUsers)
    .where(eq(adminUsers.id, id))
    .limit(1);
  return user ?? null;
}

export async function findAllAdmins(): Promise<AdminUserListItem[]> {
  const rows = await db
    .select({
      id: adminUsers.id,
      name: adminUsers.name,
      email: adminUsers.email,
      role: adminUsers.role,
      createdAt: adminUsers.createdAt,
      updatedAt: adminUsers.updatedAt,
    })
    .from(adminUsers)
    .orderBy(desc(adminUsers.createdAt));
  return rows;
}

export async function createAdmin(data: {
  name: string;
  email: string;
  password: string;
  role: "admin" | "cashier" | "chef";
}) {
  const [row] = await db
    .insert(adminUsers)
    .values({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
    })
    .returning({
      id: adminUsers.id,
      name: adminUsers.name,
      email: adminUsers.email,
      role: adminUsers.role,
    });
  return row ?? null;
}

export async function updateAdmin(
  id: number,
  data: {
    name?: string;
    email?: string;
    password?: string;
    role?: "admin" | "cashier" | "chef";
  }
) {
  const payload: Record<string, unknown> = {};
  if (data.name != null) payload.name = data.name;
  if (data.email != null) payload.email = data.email;
  if (data.password != null) payload.password = data.password;
  if (data.role != null) payload.role = data.role;
  if (Object.keys(payload).length === 0) return findAdminById(id);
  payload.updatedAt = new Date();

  const [row] = await db
    .update(adminUsers)
    .set(payload as Partial<typeof adminUsers.$inferInsert>)
    .where(eq(adminUsers.id, id))
    .returning({
      id: adminUsers.id,
      name: adminUsers.name,
      email: adminUsers.email,
      role: adminUsers.role,
    });
  return row ?? null;
}

export async function deleteAdminById(id: number) {
  const [row] = await db
    .delete(adminUsers)
    .where(eq(adminUsers.id, id))
    .returning({ id: adminUsers.id });
  return row != null;
}
