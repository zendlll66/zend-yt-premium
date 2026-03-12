import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema/customer.schema";

export type CustomerProfile = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

/** รายการลูกค้าทั้งหมด (สำหรับแดชบอร์ด) — ไม่รวม password */
export async function findAllCustomers(limit = 200): Promise<CustomerProfile[]> {
  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,
    })
    .from(customers)
    .orderBy(desc(customers.createdAt))
    .limit(limit);
  return rows;
}

export async function findCustomerByEmail(email: string) {
  const [row] = await db
    .select()
    .from(customers)
    .where(eq(customers.email, email))
    .limit(1);
  return row ?? null;
}

export async function findCustomerById(id: number): Promise<CustomerProfile | null> {
  const [row] = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,
    })
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);
  return row ?? null;
}

export async function findCustomerWithPassword(id: number) {
  const [row] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return row ?? null;
}

export async function createCustomer(data: {
  name: string;
  email: string;
  passwordHash: string;
  phone?: string | null;
}) {
  const [row] = await db
    .insert(customers)
    .values({
      name: data.name,
      email: data.email,
      password: data.passwordHash,
      phone: data.phone ?? null,
    })
    .returning({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
    });
  return row ?? null;
}

export async function updateCustomer(
  id: number,
  data: { name?: string; email?: string; phone?: string | null }
) {
  const payload: Record<string, unknown> = {};
  if (data.name != null) payload.name = data.name;
  if (data.email != null) payload.email = data.email;
  if (data.phone !== undefined) payload.phone = data.phone;
  if (Object.keys(payload).length === 0) return findCustomerById(id);
  const [row] = await db
    .update(customers)
    .set(payload as Partial<typeof customers.$inferInsert>)
    .where(eq(customers.id, id))
    .returning({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,
    });
  return row ?? null;
}

export async function updateCustomerPassword(id: number, passwordHash: string) {
  const [row] = await db
    .update(customers)
    .set({ password: passwordHash })
    .where(eq(customers.id, id))
    .returning({ id: customers.id });
  return row ?? null;
}
