"use server";

import { db } from "@/db";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { createYoutubeOrder } from "@/features/order/order.repo";
import { orderItems, orderItemModifiers, type OrderProductType } from "@/db/schema/order.schema";
import { selectRenewalProduct } from "@/features/product/product.repo";
import { findCustomerInventoryById } from "./customer-inventory.repo";
import type { InventoryItemType } from "@/db/schema/customer-inventory.schema";
import { INVENTORY_RENEWAL_TARGET_MODIFIER_PREFIX } from "@/lib/inventory-renewal";
import { redirect } from "next/navigation";

function parseId(value: string | null): number | null {
  if (value == null || value === "") return null;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

export async function renewInventoryItemAction(formData: FormData) {
  const inventoryId = parseId((formData.get("inventoryId") as string) ?? null);
  if (!inventoryId) redirect("/account/inventory");

  const customer = await getCustomerSession();
  if (!customer) redirect("/customer-login");

  const inventoryRow = await findCustomerInventoryById(customer.id, inventoryId);
  if (!inventoryRow) redirect("/account/inventory");

  const expiresAt = inventoryRow.expiresAt ? new Date(inventoryRow.expiresAt) : null;
  if (!expiresAt || expiresAt.getTime() > Date.now()) redirect("/account/inventory");

  const itemType = inventoryRow.itemType as InventoryItemType;
  const durationMonths = inventoryRow.durationMonths;

  const renewalProduct = await selectRenewalProduct(itemType, durationMonths);

  if (!renewalProduct) redirect("/account/inventory");

  // สร้าง order แบบ pending เพื่อให้ Stripe webhook เปลี่ยนเป็น paid
  // (createYoutubeOrder จะ reserve order number ให้เอง)
  const order = await createYoutubeOrder({
    productType: itemType as unknown as OrderProductType,
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    customerId: customer.id,
    totalPrice: renewalProduct.price,
    createdBy: null,
  });

  if (!order) redirect("/account/inventory");

  // หมายเหตุ: createYoutubeOrder ไม่ได้ใส่ order_items เราต้อง insert เอง
  const [oi] = await db
    .insert(orderItems)
    .values({
      orderId: order.id,
      productId: renewalProduct.id,
      productName: renewalProduct.name,
      price: renewalProduct.price,
      quantity: 1,
      totalPrice: renewalProduct.price,
      rentalStart: null,
      rentalEnd: null,
      deliveryOption: null,
      fulfillmentStatus: null,
      fulfillmentUpdatedAt: null,
    })
    .returning();

  if (!oi) redirect("/account/inventory");

  await db.insert(orderItemModifiers).values({
    orderItemId: oi.id,
    modifierName: `${INVENTORY_RENEWAL_TARGET_MODIFIER_PREFIX}${inventoryRow.id}`,
    price: 0,
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) redirect("/account/inventory");

  const res = await fetch(`${baseUrl}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId: order.id, paymentMethod: "stripe" }),
  });

  if (!res.ok) {
    redirect("/account/inventory?renewalError=payment_disabled");
  }

  const data: { url?: string } = await res.json();
  if (!data.url) redirect("/account/inventory?renewalError=checkout_failed");

  redirect(data.url);
}

