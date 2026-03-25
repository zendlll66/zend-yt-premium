/**
 * Notification Service
 * รองรับ 2 ช่องทาง: LINE push และ Email (Resend API)
 *
 * ตั้งค่าใน .env:
 *   RESEND_API_KEY=re_xxxx         (สำหรับ email ผ่าน Resend)
 *   NOTIFICATION_EMAIL_FROM=noreply@yourdomain.com
 */

import { pushLineTextMessage } from "@/lib/line-message";
import { logNotification } from "./notification.repo";
import { getLineTemplate, renderTemplate } from "@/features/support/line-template.repo";
import type { NotificationType } from "@/db/schema/notification-log.schema";

// ----- Email via Resend API -----

async function sendEmailViaResend(
  to: string,
  subject: string,
  htmlBody: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_EMAIL_FROM || "noreply@example.com";

  if (!apiKey) throw new Error("RESEND_API_KEY ยังไม่ได้ตั้งค่า");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html: htmlBody,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
}

// ----- Helper -----

function formatMoney(n: number) {
  return new Intl.NumberFormat("th-TH", { minimumFractionDigits: 0 }).format(n);
}

function wrapHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="th"><head><meta charset="UTF-8"/><style>
body{font-family:sans-serif;background:#f5f5f5;margin:0;padding:20px;}
.card{background:#fff;border-radius:12px;max-width:520px;margin:0 auto;padding:32px;}
h2{color:#222;margin-top:0;}
.badge{display:inline-block;padding:4px 12px;border-radius:999px;font-size:13px;font-weight:600;}
.badge-green{background:#d1fae5;color:#065f46;}
.badge-blue{background:#dbeafe;color:#1e40af;}
.footer{margin-top:24px;font-size:12px;color:#888;}
</style></head><body>
<div class="card">
<h2>${title}</h2>
${body}
<div class="footer">ขอบคุณที่ใช้บริการ</div>
</div></body></html>`;
}

// ----- Public API -----

/** ส่งแจ้งเตือนยืนยัน order ใหม่ */
export async function sendOrderConfirmNotification(params: {
  customerEmail: string;
  customerLineUserId?: string | null;
  customerId?: number;
  orderId: number;
  orderNumber: string;
  totalPrice: number;
  shopName?: string;
}): Promise<void> {
  const type: NotificationType = "order_confirm";
  const shopName = params.shopName || "ร้านของเรา";
  const tplConfirm = await getLineTemplate("order_confirm").catch(() => null);
  const message = tplConfirm?.isEnabled !== false
    ? renderTemplate(
        tplConfirm?.template ?? "✅ ได้รับคำสั่งซื้อ #{{orderNumber}} แล้ว\nยอด: {{totalPrice}} บาท\nกรุณาชำระเงินเพื่อดำเนินการต่อ",
        { orderNumber: params.orderNumber, totalPrice: formatMoney(params.totalPrice), shopName }
      )
    : "";
  const subject = `[${shopName}] ยืนยันคำสั่งซื้อ #${params.orderNumber}`;
  const html = wrapHtml(
    `คำสั่งซื้อ #${params.orderNumber}`,
    `<p>ได้รับคำสั่งซื้อของคุณเรียบร้อยแล้ว</p>
     <p>ยอดรวม: <strong>${formatMoney(params.totalPrice)} บาท</strong></p>
     <p>กรุณาชำระเงินเพื่อให้เราดำเนินการต่อ</p>`
  );

  // LINE
  if (params.customerLineUserId && message) {
    try {
      await pushLineTextMessage(params.customerLineUserId, message);
      await logNotification({ type, channel: "line", recipient: params.customerLineUserId, customerId: params.customerId, orderId: params.orderId, content: message, status: "sent" });
    } catch (e) {
      await logNotification({ type, channel: "line", recipient: params.customerLineUserId, customerId: params.customerId, orderId: params.orderId, content: message, status: "failed", error: String(e) });
    }
  }

  // Email
  if (params.customerEmail && !params.customerEmail.includes("@liff")) {
    try {
      await sendEmailViaResend(params.customerEmail, subject, html);
      await logNotification({ type, channel: "email", recipient: params.customerEmail, customerId: params.customerId, orderId: params.orderId, subject, content: html, status: "sent" });
    } catch (e) {
      await logNotification({ type, channel: "email", recipient: params.customerEmail, customerId: params.customerId, orderId: params.orderId, subject, content: html, status: "failed", error: String(e) });
    }
  }
}

/** ส่งแจ้งเตือนชำระเงินสำเร็จ */
export async function sendOrderPaidNotification(params: {
  customerEmail: string;
  customerLineUserId?: string | null;
  customerId?: number;
  orderId: number;
  orderNumber: string;
  totalPrice: number;
  shopName?: string;
}): Promise<void> {
  const type: NotificationType = "order_paid";
  const shopName = params.shopName || "ร้านของเรา";
  const tplPaid = await getLineTemplate("order_paid").catch(() => null);
  const message = tplPaid?.isEnabled !== false
    ? renderTemplate(
        tplPaid?.template ?? "💳 ชำระเงินสำเร็จ Order #{{orderNumber}}\nยอด: {{totalPrice}} บาท\nเราจะส่ง credentials ให้เร็วๆ นี้",
        { orderNumber: params.orderNumber, totalPrice: formatMoney(params.totalPrice), shopName }
      )
    : "";
  const subject = `[${shopName}] ชำระเงินสำเร็จ #${params.orderNumber}`;
  const html = wrapHtml(
    `ชำระเงินสำเร็จ #${params.orderNumber}`,
    `<p>ชำระเงินเรียบร้อยแล้ว <span class="badge badge-green">ชำระแล้ว</span></p>
     <p>ยอดรวม: <strong>${formatMoney(params.totalPrice)} บาท</strong></p>
     <p>เราจะส่ง credentials ให้เร็วๆ นี้</p>`
  );

  if (params.customerLineUserId && message) {
    try {
      await pushLineTextMessage(params.customerLineUserId, message);
      await logNotification({ type, channel: "line", recipient: params.customerLineUserId, customerId: params.customerId, orderId: params.orderId, content: message, status: "sent" });
    } catch (e) {
      await logNotification({ type, channel: "line", recipient: params.customerLineUserId, customerId: params.customerId, orderId: params.orderId, content: message, status: "failed", error: String(e) });
    }
  }

  if (params.customerEmail && !params.customerEmail.includes("@liff")) {
    try {
      await sendEmailViaResend(params.customerEmail, subject, html);
      await logNotification({ type, channel: "email", recipient: params.customerEmail, customerId: params.customerId, orderId: params.orderId, subject, content: html, status: "sent" });
    } catch (e) {
      await logNotification({ type, channel: "email", recipient: params.customerEmail, customerId: params.customerId, orderId: params.orderId, subject, content: html, status: "failed", error: String(e) });
    }
  }
}

/** ส่งแจ้งเตือนส่งมอบ credentials แล้ว */
export async function sendOrderFulfilledNotification(params: {
  customerEmail: string;
  customerLineUserId?: string | null;
  customerId?: number;
  orderId: number;
  orderNumber: string;
  shopName?: string;
  accountUrl?: string;
}): Promise<void> {
  const type: NotificationType = "order_fulfilled";
  const shopName = params.shopName || "ร้านของเรา";
  const accountUrl = params.accountUrl || "";
  const tplFulfilled = await getLineTemplate("order_fulfilled").catch(() => null);
  const message = tplFulfilled?.isEnabled !== false
    ? renderTemplate(
        tplFulfilled?.template ?? "🎉 Order #{{orderNumber}} ส่งมอบแล้ว!\nดู credentials ได้ที่: {{accountUrl}}/account/inventory",
        { orderNumber: params.orderNumber, accountUrl, shopName }
      )
    : "";
  const subject = `[${shopName}] รหัสของคุณพร้อมแล้ว #${params.orderNumber}`;
  const html = wrapHtml(
    `รหัสของคุณพร้อมแล้ว`,
    `<p>Order #${params.orderNumber} ได้รับการจัดส่งเรียบร้อยแล้ว</p>
     <p>ดู credentials ได้ที่: <a href="${accountUrl}/account/inventory">${accountUrl}/account/inventory</a></p>`
  );

  if (params.customerLineUserId && message) {
    try {
      await pushLineTextMessage(params.customerLineUserId, message);
      await logNotification({ type, channel: "line", recipient: params.customerLineUserId, customerId: params.customerId, orderId: params.orderId, content: message, status: "sent" });
    } catch (e) {
      await logNotification({ type, channel: "line", recipient: params.customerLineUserId, customerId: params.customerId, orderId: params.orderId, content: message, status: "failed", error: String(e) });
    }
  }

  if (params.customerEmail && !params.customerEmail.includes("@liff")) {
    try {
      await sendEmailViaResend(params.customerEmail, subject, html);
      await logNotification({ type, channel: "email", recipient: params.customerEmail, customerId: params.customerId, orderId: params.orderId, subject, content: html, status: "sent" });
    } catch (e) {
      await logNotification({ type, channel: "email", recipient: params.customerEmail, customerId: params.customerId, orderId: params.orderId, subject, content: html, status: "failed", error: String(e) });
    }
  }
}

/** ส่งแจ้งเตือน wallet ได้รับเครดิต */
export async function sendWalletCreditNotification(params: {
  customerEmail: string;
  customerLineUserId?: string | null;
  customerId?: number;
  amount: number;
  balanceAfter: number;
  description: string;
  shopName?: string;
}): Promise<void> {
  const type: NotificationType = "wallet_credit";
  const tplWallet = await getLineTemplate("wallet_credit").catch(() => null);
  const message = tplWallet?.isEnabled !== false
    ? renderTemplate(
        tplWallet?.template ?? "💰 เติม Wallet +{{amount}} บาท\n{{description}}\nยอดคงเหลือ: {{balanceAfter}} บาท",
        {
          amount: formatMoney(params.amount),
          description: params.description,
          balanceAfter: formatMoney(params.balanceAfter),
          shopName: params.shopName || "ร้านของเรา",
        }
      )
    : "";

  if (params.customerLineUserId && message) {
    try {
      await pushLineTextMessage(params.customerLineUserId, message);
      await logNotification({ type, channel: "line", recipient: params.customerLineUserId, customerId: params.customerId, content: message, status: "sent" });
    } catch (e) {
      await logNotification({ type, channel: "line", recipient: params.customerLineUserId, customerId: params.customerId, content: message, status: "failed", error: String(e) });
    }
  }
}
