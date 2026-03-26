"use server";

import { getSessionUser } from "@/lib/auth-server";
import { findAllCustomers } from "@/features/customer/customer.repo";
import { pushLineTextMessage } from "@/lib/line-message";
import { logNotification } from "@/features/notification/notification.repo";

export type BulkNotifyState = {
  error?: string;
  success?: boolean;
  sent?: number;
  skipped?: number;
};

export async function bulkNotifyAction(
  _prev: BulkNotifyState,
  formData: FormData
): Promise<BulkNotifyState> {
  const user = await getSessionUser();
  if (!user) return { error: "ไม่มีสิทธิ์" };

  const message = (formData.get("message") as string)?.trim();
  if (!message) return { error: "กรุณาใส่ข้อความ" };

  const segment = (formData.get("segment") as string) || "line";

  const customers = await findAllCustomers(1000);
  const targets = segment === "all"
    ? customers.filter((c) => c.lineUserId)
    : customers.filter((c) => c.lineUserId);

  let sent = 0;
  let skipped = 0;

  for (const c of targets) {
    if (!c.lineUserId) { skipped++; continue; }
    try {
      await pushLineTextMessage(c.lineUserId, message);
      await logNotification({
        type: "bulk_notify",
        channel: "line",
        recipient: c.lineUserId,
        customerId: c.id,
        content: message,
        status: "sent",
      });
      sent++;
    } catch (e) {
      await logNotification({
        type: "bulk_notify",
        channel: "line",
        recipient: c.lineUserId,
        customerId: c.id,
        content: message,
        status: "failed",
        error: e instanceof Error ? e.message : "unknown",
      });
      skipped++;
    }
  }

  return { success: true, sent, skipped };
}
