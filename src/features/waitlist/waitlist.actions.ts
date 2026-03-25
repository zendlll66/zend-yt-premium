"use server";

import { revalidatePath } from "next/cache";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { getSessionUser } from "@/lib/auth-server";
import {
  addToWaitlist,
  cancelWaitlist,
  isCustomerInWaitlist,
  getWaitlistByProduct,
  markWaitlistNotified,
} from "./waitlist.repo";
import { pushLineTextMessage } from "@/lib/line-message";
import { getLineTemplate, renderTemplate } from "@/features/support/line-template.repo";
import { logNotification } from "@/features/notification/notification.repo";

/** ลูกค้าสมัคร waitlist สินค้า */
export async function joinWaitlistAction(productId: number) {
  const customer = await getCustomerSession();
  if (!customer) return { error: "กรุณาเข้าสู่ระบบ" };
  await addToWaitlist(productId, customer.id);
  revalidatePath("/rent");
  return { ok: true };
}

/** ลูกค้ายกเลิก waitlist */
export async function leaveWaitlistAction(productId: number) {
  const customer = await getCustomerSession();
  if (!customer) return { error: "กรุณาเข้าสู่ระบบ" };
  await cancelWaitlist(productId, customer.id);
  revalidatePath("/rent");
  revalidatePath("/account/waitlist");
  return { ok: true };
}

/** Admin ส่งแจ้งเตือน waitlist สำหรับสินค้า */
export async function notifyWaitlistAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) return { error: "ไม่มีสิทธิ์" };

  const productId = parseInt(formData.get("productId") as string, 10);
  const productName = (formData.get("productName") as string)?.trim() || "สินค้า";
  if (!Number.isFinite(productId)) return { error: "ข้อมูลไม่ถูกต้อง" };

  const waitlist = await getWaitlistByProduct(productId);
  if (waitlist.length === 0) return { ok: true, sent: 0 };

  let sent = 0;
  const tpl = await getLineTemplate("waitlist_available").catch(() => null);
  const messageTemplate =
    tpl?.template ?? '📦 สินค้า "{{productName}}" มี stock ใหม่แล้ว!\nเข้าไปสั่งซื้อได้เลย';
  const isEnabled = tpl?.isEnabled !== false;

  for (const item of waitlist) {
    if (item.customerLineUserId && isEnabled) {
      const message = renderTemplate(messageTemplate, { productName });
      try {
        await pushLineTextMessage(item.customerLineUserId, message);
        await logNotification({
          type: "waitlist_available",
          channel: "line",
          recipient: item.customerLineUserId,
          customerId: item.customerId ?? undefined,
          content: message,
          status: "sent",
        });
        sent++;
      } catch (e) {
        await logNotification({
          type: "waitlist_available",
          channel: "line",
          recipient: item.customerLineUserId,
          customerId: item.customerId ?? undefined,
          content: message,
          status: "failed",
          error: e instanceof Error ? e.message : "unknown",
        });
      }
    }
  }

  await markWaitlistNotified(waitlist.map((w) => w.id));
  revalidatePath("/dashboard/waitlist");
  return { ok: true, sent };
}
