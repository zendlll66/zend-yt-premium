"use server";

import { revalidatePath } from "next/cache";
import {
  createOrder,
  findOrderById,
  updateOrderStatus,
  updateKitchenOrderStatus,
} from "./order.repo";
import type { OrderItemInput } from "./order.repo";

export type CreateOrderState = { orderId?: number; orderNumber?: string; error?: string };

export async function createOrderAction(input: {
  tableId?: number | null;
  createdBy?: number | null;
  items: OrderItemInput[];
}): Promise<CreateOrderState> {
  if (!input.items?.length) {
    return { error: "ไม่มีรายการสินค้า" };
  }

  for (const item of input.items) {
    if (!item.productName?.trim()) return { error: "ชื่อสินค้าไม่ถูกต้อง" };
    if (typeof item.price !== "number" || item.price < 0) return { error: "ราคาไม่ถูกต้อง" };
    if (!Number.isInteger(item.quantity) || item.quantity < 1) return { error: "จำนวนไม่ถูกต้อง" };
    if (!Array.isArray(item.modifiers)) item.modifiers = [];
    for (const m of item.modifiers) {
      if (!m.modifierName?.trim()) return { error: "ชื่อตัวเลือกไม่ถูกต้อง" };
      if (typeof m.price !== "number" || m.price < 0) return { error: "ราคาตัวเลือกไม่ถูกต้อง" };
    }
  }

  const order = await createOrder({
    tableId: input.tableId ?? null,
    createdBy: input.createdBy ?? null,
    items: input.items,
  });

  if (!order) return { error: "สร้างบิลไม่สำเร็จ" };

  revalidatePath("/dashboard/orders");
  return { orderId: order.id, orderNumber: order.orderNumber };
}

export async function updateOrderStatusAction(
  orderId: number,
  status: "pending" | "preparing" | "ready" | "served" | "paid" | "cancelled"
) {
  const order = await updateOrderStatus(orderId, status);
  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/dashboard/kitchen");
  return order ? {} : { error: "ไม่พบบิล" };
}

/** อัปเดตสถานะรายการสั่งครัว (หน้าเชฟใช้) */
export async function updateKitchenOrderStatusAction(
  kitchenOrderId: number,
  status: "pending" | "preparing" | "ready" | "served"
) {
  const row = await updateKitchenOrderStatus(kitchenOrderId, status);
  revalidatePath("/dashboard/kitchen");
  if (row) {
    revalidatePath(`/dashboard/orders/${row.orderId}`);
  }
  return row ? {} : { error: "ไม่พบรายการสั่ง" };
}

/** ลูกค้าส่งคำสั่งโต๊ะ: สร้างบิลใหม่หรือเพิ่มเข้าบิลเดิมของโต๊ะ */
export async function submitTableOrderAction(
  tableId: number,
  items: OrderItemInput[]
): Promise<{ orderId?: number; orderNumber?: string; error?: string }> {
  if (!items?.length) return { error: "ไม่มีรายการ" };

  for (const item of items) {
    if (!item.productName?.trim()) return { error: "ชื่อสินค้าไม่ถูกต้อง" };
    if (typeof item.price !== "number" || item.price < 0) return { error: "ราคาไม่ถูกต้อง" };
    if (!Number.isInteger(item.quantity) || item.quantity < 1) return { error: "จำนวนไม่ถูกต้อง" };
    if (!Array.isArray(item.modifiers)) item.modifiers = [];
  }

  const { getTableOrder, createOrder, addItemsToOrder } = await import("./order.repo");
  const existing = await getTableOrder(tableId);

  if (existing) {
    const updated = await addItemsToOrder(existing.id, items);
    return updated ? { orderId: updated.id, orderNumber: updated.orderNumber } : { error: "เพิ่มรายการไม่สำเร็จ" };
  }

  const order = await createOrder({ tableId, createdBy: null, items });
  if (!order) return { error: "สร้างบิลไม่สำเร็จ" };
  return { orderId: order.id, orderNumber: order.orderNumber };
}
