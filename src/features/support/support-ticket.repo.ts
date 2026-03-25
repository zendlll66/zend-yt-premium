import { db } from "@/db";
import { supportTickets, TICKET_STATUS_LABELS, type TicketStatus } from "@/db/schema/support-ticket.schema";
import { customers } from "@/db/schema/customer.schema";
import { orders } from "@/db/schema/order.schema";
import { adminUsers } from "@/db/schema/admin-user.schema";
import { eq, desc } from "drizzle-orm";

export type TicketRow = typeof supportTickets.$inferSelect;

/** รายการ ticket ของลูกค้า (customer view) */
export async function getCustomerTickets(customerId: number) {
  return db
    .select({
      id: supportTickets.id,
      subject: supportTickets.subject,
      status: supportTickets.status,
      orderNumber: orders.orderNumber,
      createdAt: supportTickets.createdAt,
      updatedAt: supportTickets.updatedAt,
    })
    .from(supportTickets)
    .leftJoin(orders, eq(supportTickets.orderId, orders.id))
    .where(eq(supportTickets.customerId, customerId))
    .orderBy(desc(supportTickets.createdAt));
}

/** รายละเอียด ticket (customer view) */
export async function getCustomerTicketById(ticketId: number, customerId: number) {
  const [row] = await db
    .select({
      id: supportTickets.id,
      subject: supportTickets.subject,
      description: supportTickets.description,
      status: supportTickets.status,
      adminNote: supportTickets.adminNote,
      orderId: supportTickets.orderId,
      orderNumber: orders.orderNumber,
      createdAt: supportTickets.createdAt,
      updatedAt: supportTickets.updatedAt,
    })
    .from(supportTickets)
    .leftJoin(orders, eq(supportTickets.orderId, orders.id))
    .where(eq(supportTickets.id, ticketId))
    .limit(1);

  if (!row || row.id !== ticketId) return null;
  // ตรวจสอบว่าเป็นของลูกค้าคนนั้น
  const [ticket] = await db
    .select({ customerId: supportTickets.customerId })
    .from(supportTickets)
    .where(eq(supportTickets.id, ticketId))
    .limit(1);
  if (!ticket || ticket.customerId !== customerId) return null;
  return row;
}

/** รายการ ticket ทั้งหมด (admin view) */
export async function listAllTickets() {
  return db
    .select({
      id: supportTickets.id,
      subject: supportTickets.subject,
      description: supportTickets.description,
      status: supportTickets.status,
      adminNote: supportTickets.adminNote,
      customerId: supportTickets.customerId,
      customerName: customers.name,
      customerEmail: customers.email,
      orderId: supportTickets.orderId,
      orderNumber: orders.orderNumber,
      adminId: supportTickets.adminId,
      createdAt: supportTickets.createdAt,
      updatedAt: supportTickets.updatedAt,
    })
    .from(supportTickets)
    .leftJoin(customers, eq(supportTickets.customerId, customers.id))
    .leftJoin(orders, eq(supportTickets.orderId, orders.id))
    .orderBy(desc(supportTickets.createdAt));
}

/** รายละเอียด ticket (admin view) */
export async function getTicketByIdAdmin(ticketId: number) {
  const [row] = await db
    .select({
      id: supportTickets.id,
      subject: supportTickets.subject,
      description: supportTickets.description,
      status: supportTickets.status,
      adminNote: supportTickets.adminNote,
      customerId: supportTickets.customerId,
      customerName: customers.name,
      customerEmail: customers.email,
      lineUserId: customers.lineUserId,
      orderId: supportTickets.orderId,
      orderNumber: orders.orderNumber,
      adminId: supportTickets.adminId,
      adminName: adminUsers.name,
      createdAt: supportTickets.createdAt,
      updatedAt: supportTickets.updatedAt,
    })
    .from(supportTickets)
    .leftJoin(customers, eq(supportTickets.customerId, customers.id))
    .leftJoin(orders, eq(supportTickets.orderId, orders.id))
    .leftJoin(adminUsers, eq(supportTickets.adminId, adminUsers.id))
    .where(eq(supportTickets.id, ticketId))
    .limit(1);
  return row ?? null;
}

/** สร้าง ticket ใหม่ */
export async function createTicket(data: {
  customerId: number;
  orderId?: number | null;
  subject: string;
  description: string;
}) {
  const [ticket] = await db
    .insert(supportTickets)
    .values({
      customerId: data.customerId,
      orderId: data.orderId ?? null,
      subject: data.subject,
      description: data.description,
      status: "pending",
    })
    .returning();
  return ticket;
}

/** อัปเดตสถานะ ticket */
export async function updateTicketStatus(
  ticketId: number,
  status: TicketStatus,
  adminId: number,
  adminNote?: string
) {
  const [updated] = await db
    .update(supportTickets)
    .set({
      status,
      adminId,
      adminNote: adminNote ?? null,
    })
    .where(eq(supportTickets.id, ticketId))
    .returning();
  return updated;
}

/** Orders ของลูกค้าที่ใช้เลือกใน ticket form */
export async function getCustomerOrdersForTicket(customerId: number) {
  return db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.customerId, customerId))
    .orderBy(desc(orders.createdAt))
    .limit(50);
}

/** แปลงสถานะเป็นภาษาไทย */
export function getStatusLabel(status: TicketStatus): string {
  return TICKET_STATUS_LABELS[status] ?? status;
}
