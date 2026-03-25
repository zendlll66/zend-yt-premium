"use server";

import { revalidatePath } from "next/cache";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { getSessionUser } from "@/lib/auth-server";
import { createAuditLog } from "@/features/audit/audit.repo";
import { addWalletCredit } from "./wallet.repo";
import {
  updateTopupSlip,
  approveTopupRequest,
  rejectTopupRequest,
  findTopupById,
} from "./wallet-topup.repo";

/** ลูกค้าอัปโหลดสลิปโอนเงิน */
export async function uploadTopupSlipAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const customer = await getCustomerSession();
  if (!customer) return { error: "กรุณาเข้าสู่ระบบ" };

  const topupIdRaw = formData.get("topupId") as string;
  const slipImageUrl = (formData.get("slipImageUrl") as string)?.trim();

  const topupId = parseInt(topupIdRaw, 10);
  if (!Number.isFinite(topupId)) return { error: "ไม่พบคำขอเติมเงิน" };
  if (!slipImageUrl) return { error: "กรุณาอัปโหลดสลิป" };

  const topup = await findTopupById(topupId);
  if (!topup || topup.customerId !== customer.id) return { error: "ไม่พบคำขอเติมเงิน" };
  if (topup.status !== "pending") return { error: "คำขอนี้ดำเนินการแล้ว" };
  if (topup.method !== "bank") return { error: "คำขอนี้ไม่ใช่การโอนธนาคาร" };

  await updateTopupSlip(topupId, slipImageUrl);
  revalidatePath("/account/wallet");
  return { success: true };
}

/** Admin อนุมัติคำขอเติมเงิน → เติมเงินเข้า wallet */
export async function approveTopupAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const user = await getSessionUser();
  if (!user) return { error: "ไม่มีสิทธิ์" };

  const topupId = parseInt(formData.get("topupId") as string, 10);
  const adminNote = (formData.get("adminNote") as string)?.trim() || undefined;

  if (!Number.isFinite(topupId)) return { error: "ไม่พบคำขอ" };

  const topup = await findTopupById(topupId);
  if (!topup) return { error: "ไม่พบคำขอเติมเงิน" };
  if (topup.status !== "pending") return { error: "คำขอนี้ดำเนินการแล้ว" };

  await approveTopupRequest(topupId, user.id, adminNote);
  await addWalletCredit(topup.customerId, topup.amount, `เติมเงิน #${topupId}`, user.id);

  await createAuditLog({
    adminUserId: user.id,
    action: "wallet.topup.approve",
    entityType: "customer",
    entityId: String(topup.customerId),
    details: `อนุมัติเติมเงิน ${topup.amount} บาท (topup #${topupId})`,
  });

  revalidatePath("/dashboard/wallets/topup");
  revalidatePath(`/dashboard/customers/${topup.customerId}`);
  return { success: true };
}

/** Admin ปฏิเสธคำขอเติมเงิน */
export async function rejectTopupAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const user = await getSessionUser();
  if (!user) return { error: "ไม่มีสิทธิ์" };

  const topupId = parseInt(formData.get("topupId") as string, 10);
  const adminNote = (formData.get("adminNote") as string)?.trim() || undefined;

  if (!Number.isFinite(topupId)) return { error: "ไม่พบคำขอ" };

  const topup = await findTopupById(topupId);
  if (!topup) return { error: "ไม่พบคำขอเติมเงิน" };
  if (topup.status !== "pending") return { error: "คำขอนี้ดำเนินการแล้ว" };

  await rejectTopupRequest(topupId, user.id, adminNote);

  await createAuditLog({
    adminUserId: user.id,
    action: "wallet.topup.reject",
    entityType: "customer",
    entityId: String(topup.customerId),
    details: `ปฏิเสธคำขอเติมเงิน ${topup.amount} บาท (topup #${topupId})`,
  });

  revalidatePath("/dashboard/wallets/topup");
  return { success: true };
}
