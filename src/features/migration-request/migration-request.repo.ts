import { db } from "@/db";
import { migrationRequests } from "@/db/schema/migration-request.schema";
import { customers } from "@/db/schema/customer.schema";
import { eq, desc } from "drizzle-orm";
import type { MigrationStockType, MigrationStatus } from "@/db/schema/migration-request.schema";

export type NewMigrationRequest = {
  customerId?: number | null;
  contactEmail: string;
  stockType: MigrationStockType;
  loginEmail: string;
  loginPassword?: string | null;
  note?: string | null;
};

export async function createMigrationRequest(data: NewMigrationRequest) {
  const [row] = await db
    .insert(migrationRequests)
    .values({
      customerId: data.customerId ?? null,
      contactEmail: data.contactEmail,
      stockType: data.stockType,
      loginEmail: data.loginEmail,
      loginPassword: data.loginPassword ?? null,
      note: data.note ?? null,
      status: "pending",
    })
    .returning();
  return row;
}

export async function listMigrationRequests() {
  return db
    .select({
      id: migrationRequests.id,
      contactEmail: migrationRequests.contactEmail,
      stockType: migrationRequests.stockType,
      loginEmail: migrationRequests.loginEmail,
      status: migrationRequests.status,
      note: migrationRequests.note,
      adminNote: migrationRequests.adminNote,
      createdAt: migrationRequests.createdAt,
      customerName: customers.name,
      customerEmail: customers.email,
    })
    .from(migrationRequests)
    .leftJoin(customers, eq(migrationRequests.customerId, customers.id))
    .orderBy(desc(migrationRequests.createdAt));
}

export async function getMigrationRequestById(id: number) {
  const [row] = await db
    .select({
      id: migrationRequests.id,
      contactEmail: migrationRequests.contactEmail,
      stockType: migrationRequests.stockType,
      loginEmail: migrationRequests.loginEmail,
      loginPassword: migrationRequests.loginPassword,
      status: migrationRequests.status,
      note: migrationRequests.note,
      adminNote: migrationRequests.adminNote,
      createdAt: migrationRequests.createdAt,
      updatedAt: migrationRequests.updatedAt,
      customerName: customers.name,
      customerEmail: customers.email,
    })
    .from(migrationRequests)
    .leftJoin(customers, eq(migrationRequests.customerId, customers.id))
    .where(eq(migrationRequests.id, id));
  return row ?? null;
}

export async function updateMigrationRequestStatus(
  id: number,
  status: MigrationStatus,
  adminNote?: string
) {
  const [row] = await db
    .update(migrationRequests)
    .set({ status, adminNote: adminNote ?? null })
    .where(eq(migrationRequests.id, id))
    .returning();
  return row;
}

export async function getCustomerMigrationRequests(customerId: number) {
  return db
    .select()
    .from(migrationRequests)
    .where(eq(migrationRequests.customerId, customerId))
    .orderBy(desc(migrationRequests.createdAt));
}
