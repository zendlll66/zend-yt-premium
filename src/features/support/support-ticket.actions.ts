"use server";

import { revalidatePath } from "next/cache";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { getSessionUser } from "@/lib/auth-server";
import { findCustomerById } from "@/features/customer/customer.repo";
import {
  createTicket,
  updateTicketStatus,
  getTicketByIdAdmin,
  getStatusLabel,
} from "./support-ticket.repo";
import { getLineTemplate, renderTemplate } from "./line-template.repo";
import { getShopSettings } from "@/features/settings/settings.repo";
import { pushLineTextMessage } from "@/lib/line-message";
import type { TicketStatus } from "@/db/schema/support-ticket.schema";

/** ลูกค้าสร้าง ticket ใหม่ */
export async function createTicketAction(
  _prev: Record<string, unknown>,
  formData: FormData
): Promise<{ error?: string; ticketId?: number }> {
  const customer = await getCustomerSession();
  if (!customer) return { error: "กรุณาเข้าสู่ระบบ" };

  const subject = formData.get("subject")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const orderIdRaw = formData.get("orderId")?.toString() ?? "";
  const orderId = orderIdRaw ? parseInt(orderIdRaw, 10) : null;

  if (!subject) return { error: "กรุณากรอกหัวข้อปัญหา" };
  if (!description) return { error: "กรุณากรอกรายละเอียดปัญหา" };
  if (subject.length > 200) return { error: "หัวข้อยาวเกินไป (สูงสุด 200 ตัวอักษร)" };

  const ticket = await createTicket({
    customerId: customer.id,
    orderId: orderId || null,
    subject,
    description,
  });

  // ส่ง LINE แจ้งลูกค้า (ถ้ามี LINE)
  if (customer.isLineUser) {
    const customerRecord = await findCustomerById(customer.id).catch(() => null);
    const lineUserId = customerRecord?.lineUserId;
    if (lineUserId) {
      const tpl = await getLineTemplate("ticket_created");
      if (tpl?.isEnabled) {
        const settings = await getShopSettings().catch(() => null);
        const shopName = settings?.shopName || "ร้านค้า";
        const now = new Date();
        const msg = renderTemplate(tpl.template, {
          customerName: customer.name ?? customer.email,
          ticketId: String(ticket.id),
          subject: ticket.subject,
          status: getStatusLabel(ticket.status as TicketStatus),
          shopName,
          date: now.toLocaleDateString("th-TH"),
          time: now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
          year: String(now.getFullYear() + 543),
          orderNumber: "",
          productName: "",
          adminNote: "",
        });
        await pushLineTextMessage(lineUserId, msg);
      }
    }
  }

  revalidatePath("/account/support");
  return { ticketId: ticket.id };
}

/** Admin อัปเดตสถานะ ticket */
export async function updateTicketStatusAction(
  _prev: Record<string, unknown>,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const admin = await getSessionUser();
  if (!admin) return { error: "Unauthorized" };

  const ticketId = parseInt(formData.get("ticketId")?.toString() ?? "", 10);
  const status = formData.get("status")?.toString() as TicketStatus;
  const adminNote = formData.get("adminNote")?.toString().trim() ?? "";

  if (!ticketId || !status) return { error: "ข้อมูลไม่ครบ" };

  const VALID_STATUSES: TicketStatus[] = ["pending", "in_progress", "resolved", "closed"];
  if (!VALID_STATUSES.includes(status)) return { error: "สถานะไม่ถูกต้อง" };

  const updated = await updateTicketStatus(ticketId, status, admin.id, adminNote || undefined);

  // ส่ง LINE แจ้งลูกค้า
  const ticket = await getTicketByIdAdmin(ticketId);
  if (ticket?.lineUserId) {
    const templateKey = `ticket_${status}` as const;
    const tpl = await getLineTemplate(templateKey);
    if (tpl?.isEnabled) {
      const settings = await getShopSettings().catch(() => null);
      const shopName = settings?.shopName || "ร้านค้า";
      const now = new Date();
      const msg = renderTemplate(tpl.template, {
        customerName: ticket.customerName ?? ticket.customerEmail ?? "",
        ticketId: String(ticket.id),
        subject: ticket.subject,
        status: getStatusLabel(updated.status as TicketStatus),
        orderNumber: ticket.orderNumber ?? "",
        shopName: shopName || "ร้านค้า",
        date: now.toLocaleDateString("th-TH"),
        time: now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
        year: String(now.getFullYear() + 543),
        productName: "",
        adminNote: adminNote || "",
      });
      await pushLineTextMessage(ticket.lineUserId, msg);
    }
  }

  revalidatePath("/dashboard/support");
  revalidatePath(`/dashboard/support/${ticketId}`);
  return { success: true };
}
