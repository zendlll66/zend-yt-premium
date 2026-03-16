"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth-server";
import { createAuditLog } from "@/features/audit/audit.repo";
import {
  createRentalOrder,
  updateOrderStatus,
  checkStockForItems,
  submitOrderBankSlip,
} from "./order.repo";
import type { OrderItemInput } from "./order.repo";
import type { OrderStatus } from "@/db/schema/order.schema";

export type CreateRentalOrderState = { orderId?: number; orderNumber?: string; error?: string };

export async function createRentalOrderAction(input: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  /** ลูกค้าในระบบ (เมื่อสร้าง order จากแดชบอร์ดให้เลือกลูกค้า) */
  customerId?: number | null;
  items: OrderItemInput[];
  /** สร้างจากแดชบอร์ด = ถือว่าจ่ายแล้ว อัปเดตเป็น paid ทันที (ไม่ยิง flow ชำระเงินลูกค้า) */
  markAsPaid?: boolean;
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
    const hasRentalDates =
      item.rentalStart != null &&
      item.rentalEnd != null &&
      Number.isFinite(new Date(item.rentalStart).getTime()) &&
      Number.isFinite(new Date(item.rentalEnd).getTime());
    if (hasRentalDates && item.rentalStart != null && item.rentalEnd != null) {
      const start = item.rentalStart instanceof Date ? item.rentalStart : new Date(item.rentalStart);
      const end = item.rentalEnd instanceof Date ? item.rentalEnd : new Date(item.rentalEnd);
      if (end <= start) return { error: `วันที่คืนต้องอยู่หลังวันที่รับ (${item.productName})` };
      if (!item.deliveryOption || !["pickup", "delivery"].includes(item.deliveryOption)) {
        return { error: "กรุณาเลือกวิธีรับสินค้า (รับที่ร้าน หรือ ส่ง) ของทุกรายการ" };
      }
    }
  }

  const itemsWithDates = input.items.map((item) => ({
    ...item,
    rentalStart:
      item.rentalStart != null && Number.isFinite(new Date(item.rentalStart).getTime())
        ? item.rentalStart instanceof Date
          ? item.rentalStart
          : new Date(item.rentalStart)
        : null,
    rentalEnd:
      item.rentalEnd != null && Number.isFinite(new Date(item.rentalEnd).getTime())
        ? item.rentalEnd instanceof Date
          ? item.rentalEnd
          : new Date(item.rentalEnd)
        : null,
    deliveryOption: item.deliveryOption ?? null,
  }));

  const stockCheck = await checkStockForItems(itemsWithDates);
  if (!stockCheck.ok) return { error: stockCheck.error };

  let order;
  try {
    order = await createRentalOrder({
      customerName: input.customerName.trim(),
      customerEmail: input.customerEmail.trim(),
      customerPhone: input.customerPhone?.trim() || null,
      customerId: input.customerId ?? null,
      items: itemsWithDates,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "MIXED_PRODUCT_TYPE_NOT_SUPPORTED") {
      return { error: "ไม่สามารถสั่งซื้อสินค้าคนละประเภทสต็อกในออเดอร์เดียวกันได้" };
    }
    if (error instanceof Error && error.message === "CUSTOMER_ACCOUNT_ORDER_NOT_SUPPORTED_IN_THIS_FLOW") {
      return { error: "แพ็กเกจแบบ Customer Account ต้องสั่งซื้อผ่านฟอร์มส่งบัญชีลูกค้า" };
    }
    throw error;
  }

  if (!order) return { error: "สร้างคำสั่งเช่าไม่สำเร็จ" };

  if (input.markAsPaid) {
    await updateOrderStatusAction(order.id, "paid");
  }

  revalidatePath("/dashboard/orders");
  return { orderId: order.id, orderNumber: order.orderNumber };
}

export async function updateOrderStatusAction(orderId: number, status: OrderStatus) {
  const order = await updateOrderStatus(orderId, status);
  if (order) {
    const user = await getSessionUser();
    await createAuditLog({
      adminUserId: user?.id ?? null,
      action: `order.status.${status}`,
      entityType: "order",
      entityId: String(orderId),
      details: `ออเดอร์ ${order.orderNumber} → ${status}`,
    });
  }
  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${orderId}`);
  return order ? {} : { error: "ไม่พบคำสั่ง" };
}

export async function submitOrderBankSlipAction(orderId: number, slipImageKey: string) {
  if (!orderId || !Number.isFinite(orderId)) return { error: "ไม่พบคำสั่งซื้อ" };
  if (!slipImageKey?.trim()) return { error: "กรุณาอัปโหลดสลิปก่อน" };

  let order: { id: number; orderNumber: string; status: string } | null = null;
  try {
    order = await submitOrderBankSlip(orderId, slipImageKey.trim());
  } catch (error) {
    if (error instanceof Error && error.message === "ORDER_BANK_SLIP_INVALID_STATUS") {
      return { error: "คำสั่งซื้อนี้ไม่สามารถแจ้งสลิปได้ในสถานะปัจจุบัน" };
    }
    throw error;
  }

  if (!order) return { error: "ไม่พบคำสั่งซื้อ" };
  const user = await getSessionUser();
  await createAuditLog({
    adminUserId: user?.id ?? null,
    action: "order.bank_slip.submitted",
    entityType: "order",
    entityId: String(orderId),
    details: `ออเดอร์ ${order.orderNumber} → wait`,
  });

  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);
  return {};
}
