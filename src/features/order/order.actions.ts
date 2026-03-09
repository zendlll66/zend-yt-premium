"use server";

import { revalidatePath } from "next/cache";
import {
  createRentalOrder,
  findOrderById,
  updateOrderStatus,
} from "./order.repo";
import type { OrderItemInput } from "./order.repo";
import type { RentalOrderStatus } from "@/db/schema/order.schema";

export type CreateRentalOrderState = { orderId?: number; orderNumber?: string; error?: string };

export async function createRentalOrderAction(input: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  rentalStart: Date;
  rentalEnd: Date;
  items: OrderItemInput[];
}): Promise<CreateRentalOrderState> {
  if (!input.items?.length) {
    return { error: "ไม่มีรายการสินค้า" };
  }
  if (!input.customerName?.trim()) return { error: "กรุณากรอกชื่อ" };
  if (!input.customerEmail?.trim()) return { error: "กรุณากรอกอีเมล" };
  if (!(input.rentalStart instanceof Date) || !(input.rentalEnd instanceof Date)) {
    return { error: "กรุณาเลือกวันที่เช่า" };
  }
  if (input.rentalEnd <= input.rentalStart) {
    return { error: "วันที่คืนต้องอยู่หลังวันที่เริ่มเช่า" };
  }

  for (const item of input.items) {
    if (!item.productName?.trim()) return { error: "ชื่อสินค้าไม่ถูกต้อง" };
    if (typeof item.price !== "number" || item.price < 0) return { error: "ราคาไม่ถูกต้อง" };
    if (!Number.isInteger(item.quantity) || item.quantity < 1) return { error: "จำนวนไม่ถูกต้อง" };
    if (!Array.isArray(item.modifiers)) item.modifiers = [];
  }

  const order = await createRentalOrder({
    customerName: input.customerName.trim(),
    customerEmail: input.customerEmail.trim(),
    customerPhone: input.customerPhone?.trim() || null,
    rentalStart: input.rentalStart,
    rentalEnd: input.rentalEnd,
    items: input.items,
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
