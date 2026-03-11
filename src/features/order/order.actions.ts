"use server";

import { revalidatePath } from "next/cache";
import {
  createRentalOrder,
  findOrderById,
  updateOrderStatus,
  checkStockForItems,
  updateOrderItemFulfillment,
} from "./order.repo";
import type { OrderItemInput } from "./order.repo";
import type { RentalOrderStatus, FulfillmentStatus } from "@/db/schema/order.schema";

export type CreateRentalOrderState = { orderId?: number; orderNumber?: string; error?: string };

export async function createRentalOrderAction(input: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  items: OrderItemInput[];
}): Promise<CreateRentalOrderState> {
  if (!input.items?.length) {
    return { error: "ไม่มีรายการสินค้า" };
  }
  if (!input.customerName?.trim()) return { error: "กรุณากรอกชื่อ" };
  if (!input.customerEmail?.trim()) return { error: "กรุณากรอกอีเมล" };

  for (const item of input.items) {
    if (!item.productName?.trim()) return { error: "ชื่อสินค้าไม่ถูกต้อง" };
    if (typeof item.price !== "number" || item.price < 0) return { error: "ราคาไม่ถูกต้อง" };
    if (!Number.isInteger(item.quantity) || item.quantity < 1) return { error: "จำนวนไม่ถูกต้อง" };
    if (!Array.isArray(item.modifiers)) item.modifiers = [];
    const start = item.rentalStart instanceof Date ? item.rentalStart : new Date(item.rentalStart);
    const end = item.rentalEnd instanceof Date ? item.rentalEnd : new Date(item.rentalEnd);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
      return { error: "กรุณาเลือกวันรับและวันคืนของทุกรายการ" };
    }
    if (end <= start) return { error: `วันที่คืนต้องอยู่หลังวันที่รับ (${item.productName})` };
    if (!item.deliveryOption || !["pickup", "delivery"].includes(item.deliveryOption)) {
      return { error: "กรุณาเลือกวิธีรับสินค้า (รับที่ร้าน หรือ ส่ง) ของทุกรายการ" };
    }
  }

  const itemsWithDates = input.items.map((item) => ({
    ...item,
    rentalStart: item.rentalStart instanceof Date ? item.rentalStart : new Date(item.rentalStart),
    rentalEnd: item.rentalEnd instanceof Date ? item.rentalEnd : new Date(item.rentalEnd),
  }));

  const stockCheck = await checkStockForItems(itemsWithDates);
  if (!stockCheck.ok) return { error: stockCheck.error };

  const order = await createRentalOrder({
    customerName: input.customerName.trim(),
    customerEmail: input.customerEmail.trim(),
    customerPhone: input.customerPhone?.trim() || null,
    items: itemsWithDates,
  });

  if (!order) return { error: "สร้างคำสั่งเช่าไม่สำเร็จ" };

  revalidatePath("/dashboard/orders");
  return { orderId: order.id, orderNumber: order.orderNumber };
}

export async function updateOrderStatusAction(orderId: number, status: RentalOrderStatus) {
  const order = await updateOrderStatus(orderId, status);
  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${orderId}`);
  return order ? {} : { error: "ไม่พบคำสั่ง" };
}

export async function updateOrderItemFulfillmentAction(
  orderItemId: number,
  orderId: number,
  status: FulfillmentStatus
) {
  const ok = await updateOrderItemFulfillment(orderItemId, status);
  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${orderId}`);
  return ok ? {} : { error: "อัปเดตไม่สำเร็จ" };
}
