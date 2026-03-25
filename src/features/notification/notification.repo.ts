import { db } from "@/db";
import { notificationLogs } from "@/db/schema/notification-log.schema";
import { customers } from "@/db/schema/customer.schema";
import { orders } from "@/db/schema/order.schema";
import { desc, eq } from "drizzle-orm";
import type { NotificationType, NotificationChannel, NotificationStatus } from "@/db/schema/notification-log.schema";

type LogNotificationInput = {
  type: NotificationType;
  channel: NotificationChannel;
  recipient: string;
  customerId?: number;
  orderId?: number;
  subject?: string;
  content: string;
  status: NotificationStatus;
  error?: string;
};

/** บันทึก log การส่ง notification */
export async function logNotification(input: LogNotificationInput) {
  await db.insert(notificationLogs).values({
    type: input.type,
    channel: input.channel,
    recipient: input.recipient,
    customerId: input.customerId ?? null,
    orderId: input.orderId ?? null,
    subject: input.subject ?? null,
    content: input.content,
    status: input.status,
    error: input.error ?? null,
  });
}

/** รายการ notification log ทั้งหมด (admin) */
export async function listNotificationLogs(limit = 100) {
  return db
    .select({
      id: notificationLogs.id,
      type: notificationLogs.type,
      channel: notificationLogs.channel,
      recipient: notificationLogs.recipient,
      customerId: notificationLogs.customerId,
      customerName: customers.name,
      orderId: notificationLogs.orderId,
      orderNumber: orders.orderNumber,
      subject: notificationLogs.subject,
      content: notificationLogs.content,
      status: notificationLogs.status,
      error: notificationLogs.error,
      sentAt: notificationLogs.sentAt,
    })
    .from(notificationLogs)
    .leftJoin(customers, eq(notificationLogs.customerId, customers.id))
    .leftJoin(orders, eq(notificationLogs.orderId, orders.id))
    .orderBy(desc(notificationLogs.sentAt))
    .limit(limit);
}
