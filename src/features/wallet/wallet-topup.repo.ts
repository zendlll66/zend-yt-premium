import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { walletTopupRequests } from "@/db/schema/wallet-topup.schema";
import { customers } from "@/db/schema/customer.schema";

export async function createTopupRequest(data: {
  customerId: number;
  amount: number;
  method: "stripe" | "bank";
  stripeSessionId?: string;
}) {
  const [row] = await db
    .insert(walletTopupRequests)
    .values({
      customerId: data.customerId,
      amount: data.amount,
      method: data.method,
      stripeSessionId: data.stripeSessionId ?? null,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return row ?? null;
}

export async function updateTopupSlip(id: number, slipImageUrl: string) {
  const [row] = await db
    .update(walletTopupRequests)
    .set({ slipImageUrl, updatedAt: new Date() })
    .where(eq(walletTopupRequests.id, id))
    .returning();
  return row ?? null;
}

export async function approveTopupRequest(id: number, adminId: number, adminNote?: string) {
  const [row] = await db
    .update(walletTopupRequests)
    .set({
      status: "approved",
      approvedByAdminId: adminId,
      approvedAt: new Date(),
      adminNote: adminNote ?? null,
      updatedAt: new Date(),
    })
    .where(eq(walletTopupRequests.id, id))
    .returning();
  return row ?? null;
}

export async function rejectTopupRequest(id: number, adminId: number, adminNote?: string) {
  const [row] = await db
    .update(walletTopupRequests)
    .set({
      status: "rejected",
      approvedByAdminId: adminId,
      approvedAt: new Date(),
      adminNote: adminNote ?? null,
      updatedAt: new Date(),
    })
    .where(eq(walletTopupRequests.id, id))
    .returning();
  return row ?? null;
}

export async function findTopupByStripeSession(stripeSessionId: string) {
  const [row] = await db
    .select()
    .from(walletTopupRequests)
    .where(eq(walletTopupRequests.stripeSessionId, stripeSessionId))
    .limit(1);
  return row ?? null;
}

export async function getCustomerTopupRequests(customerId: number) {
  return db
    .select()
    .from(walletTopupRequests)
    .where(eq(walletTopupRequests.customerId, customerId))
    .orderBy(desc(walletTopupRequests.createdAt))
    .limit(50);
}

export async function listPendingTopupRequests() {
  return db
    .select({
      id: walletTopupRequests.id,
      amount: walletTopupRequests.amount,
      method: walletTopupRequests.method,
      status: walletTopupRequests.status,
      slipImageUrl: walletTopupRequests.slipImageUrl,
      adminNote: walletTopupRequests.adminNote,
      createdAt: walletTopupRequests.createdAt,
      customerId: walletTopupRequests.customerId,
      customerName: customers.name,
      customerEmail: customers.email,
    })
    .from(walletTopupRequests)
    .leftJoin(customers, eq(walletTopupRequests.customerId, customers.id))
    .where(eq(walletTopupRequests.status, "pending"))
    .orderBy(desc(walletTopupRequests.createdAt));
}

export async function listAllTopupRequests() {
  return db
    .select({
      id: walletTopupRequests.id,
      amount: walletTopupRequests.amount,
      method: walletTopupRequests.method,
      status: walletTopupRequests.status,
      slipImageUrl: walletTopupRequests.slipImageUrl,
      adminNote: walletTopupRequests.adminNote,
      createdAt: walletTopupRequests.createdAt,
      approvedAt: walletTopupRequests.approvedAt,
      customerId: walletTopupRequests.customerId,
      customerName: customers.name,
      customerEmail: customers.email,
    })
    .from(walletTopupRequests)
    .leftJoin(customers, eq(walletTopupRequests.customerId, customers.id))
    .orderBy(desc(walletTopupRequests.createdAt))
    .limit(200);
}

export async function findTopupById(id: number) {
  const [row] = await db
    .select()
    .from(walletTopupRequests)
    .where(eq(walletTopupRequests.id, id))
    .limit(1);
  return row ?? null;
}
