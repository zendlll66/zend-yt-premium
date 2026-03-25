"use server";

import { revalidatePath } from "next/cache";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { getSessionUser } from "@/lib/auth-server";
import { createAuditLog } from "@/features/audit/audit.repo";
import {
  getOrCreateWallet,
  getWalletTransactions,
  addWalletCredit,
  refundToWallet,
} from "./wallet.repo";

/** ดึงข้อมูล wallet ของลูกค้าที่ login (เรียกจากหน้า account) */
export async function getMyWalletAction() {
  const customer = await getCustomerSession();
  if (!customer) return null;
  const wallet = await getOrCreateWallet(customer.id);
  const transactions = await getWalletTransactions(customer.id);
  return { wallet, transactions };
}

/** Admin เติม wallet ให้ลูกค้า */
export async function adminAddCreditAction(
  _prev: { success?: boolean; error?: string },
  formData: FormData
) {
  const user = await getSessionUser();
  if (!user) return { error: "ไม่มีสิทธิ์" };

  const customerId = parseInt(formData.get("customerId") as string, 10);
  const amount = parseFloat(formData.get("amount") as string);
  const description = (formData.get("description") as string)?.trim() || "Admin เติมเงิน";

  if (!Number.isFinite(customerId)) return { error: "ไม่พบลูกค้า" };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "จำนวนเงินต้องมากกว่า 0" };

  await addWalletCredit(customerId, amount, description, user.id);

  await createAuditLog({
    adminUserId: user.id,
    action: "wallet.credit",
    entityType: "customer",
    entityId: String(customerId),
    details: `เติม wallet ${amount} บาท — ${description}`,
  });

  revalidatePath(`/dashboard/customers/${customerId}`);
  revalidatePath("/dashboard/wallets");
  return { success: true };
}

/** Admin คืนเงินเข้า wallet */
export async function adminRefundToWalletAction(
  _prev: { success?: boolean; error?: string },
  formData: FormData
) {
  const user = await getSessionUser();
  if (!user) return { error: "ไม่มีสิทธิ์" };

  const customerId = parseInt(formData.get("customerId") as string, 10);
  const orderId = parseInt(formData.get("orderId") as string, 10);
  const amount = parseFloat(formData.get("amount") as string);
  const description = (formData.get("description") as string)?.trim() || "Refund";

  if (!Number.isFinite(customerId) || !Number.isFinite(orderId)) return { error: "ข้อมูลไม่ถูกต้อง" };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "จำนวนเงินต้องมากกว่า 0" };

  await refundToWallet(customerId, amount, orderId, description);

  await createAuditLog({
    adminUserId: user.id,
    action: "wallet.refund",
    entityType: "order",
    entityId: String(orderId),
    details: `Refund ${amount} บาท เข้า wallet ลูกค้า ${customerId}`,
  });

  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/dashboard/wallets");
  return { success: true };
}
