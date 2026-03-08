import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminUsers } from "@/db/schema/admin-user.schema";

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
