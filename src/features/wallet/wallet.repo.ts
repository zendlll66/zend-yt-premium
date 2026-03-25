import { db } from "@/db";
import { customerWallets, walletTransactions } from "@/db/schema/wallet.schema";
import { customers } from "@/db/schema/customer.schema";
import { orders } from "@/db/schema/order.schema";
import { eq, desc, sql } from "drizzle-orm";

export type WalletRow = typeof customerWallets.$inferSelect;
export type WalletTransactionRow = typeof walletTransactions.$inferSelect;

/** ดึง wallet ของลูกค้า (สร้างถ้ายังไม่มี) */
export async function getOrCreateWallet(customerId: number): Promise<WalletRow> {
  const [existing] = await db
    .select()
    .from(customerWallets)
    .where(eq(customerWallets.customerId, customerId))
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(customerWallets)
    .values({ customerId, balance: 0 })
    .returning();
  return created;
}

/** ดึงยอด wallet */
export async function getWalletBalance(customerId: number): Promise<number> {
  const wallet = await getOrCreateWallet(customerId);
  return wallet.balance;
}

/** ดึงประวัติธุรกรรม */
export async function getWalletTransactions(customerId: number) {
  return db
    .select({
      id: walletTransactions.id,
      type: walletTransactions.type,
      amount: walletTransactions.amount,
      balanceAfter: walletTransactions.balanceAfter,
      description: walletTransactions.description,
      orderId: walletTransactions.orderId,
      orderNumber: orders.orderNumber,
      createdAt: walletTransactions.createdAt,
    })
    .from(walletTransactions)
    .leftJoin(orders, eq(walletTransactions.orderId, orders.id))
    .where(eq(walletTransactions.customerId, customerId))
    .orderBy(desc(walletTransactions.createdAt))
    .limit(100);
}

/** เพิ่มเงินเข้า wallet */
export async function addWalletCredit(
  customerId: number,
  amount: number,
  description: string,
  adminId?: number | null
): Promise<WalletRow> {
  if (amount <= 0) throw new Error("จำนวนเงินต้องมากกว่า 0");

  const wallet = await getOrCreateWallet(customerId);
  const newBalance = wallet.balance + amount;

  const [updated] = await db
    .update(customerWallets)
    .set({ balance: newBalance })
    .where(eq(customerWallets.id, wallet.id))
    .returning();

  await db.insert(walletTransactions).values({
    customerId,
    type: "credit",
    amount,
    balanceAfter: newBalance,
    description,
    createdByAdminId: adminId ?? null,
  });

  return updated;
}

/** ตัดเงินจาก wallet (สำหรับ checkout) */
export async function debitWallet(
  customerId: number,
  amount: number,
  orderId: number,
  description: string
): Promise<WalletRow> {
  const wallet = await getOrCreateWallet(customerId);
  if (wallet.balance < amount) throw new Error("ยอด wallet ไม่เพียงพอ");

  const newBalance = wallet.balance - amount;

  const [updated] = await db
    .update(customerWallets)
    .set({ balance: newBalance })
    .where(eq(customerWallets.id, wallet.id))
    .returning();

  await db.insert(walletTransactions).values({
    customerId,
    type: "debit",
    amount: -amount,
    balanceAfter: newBalance,
    description,
    orderId,
  });

  return updated;
}

/** คืนเงินเข้า wallet (refund) */
export async function refundToWallet(
  customerId: number,
  amount: number,
  orderId: number,
  description: string
): Promise<WalletRow> {
  const wallet = await getOrCreateWallet(customerId);
  const newBalance = wallet.balance + amount;

  const [updated] = await db
    .update(customerWallets)
    .set({ balance: newBalance })
    .where(eq(customerWallets.id, wallet.id))
    .returning();

  await db.insert(walletTransactions).values({
    customerId,
    type: "refund",
    amount,
    balanceAfter: newBalance,
    description,
    orderId,
  });

  return updated;
}

/** รายการ wallet ทั้งหมด (admin dashboard) */
export async function listWalletsAdmin() {
  return db
    .select({
      walletId: customerWallets.id,
      customerId: customerWallets.customerId,
      customerName: customers.name,
      customerEmail: customers.email,
      balance: customerWallets.balance,
      updatedAt: customerWallets.updatedAt,
    })
    .from(customerWallets)
    .leftJoin(customers, eq(customerWallets.customerId, customers.id))
    .orderBy(desc(customerWallets.balance));
}
