"use client";

import { useRouter } from "next/navigation";
import { updateOrderItemFulfillmentAction } from "@/features/order/order.actions";
import type { FulfillmentStatus } from "@/db/schema/order.schema";

const FULFILLMENT_LABELS: Record<string, string> = {
  pending: "รอจัดส่ง",
  shipped: "ส่งแล้ว",
  delivered: "ส่งถึงแล้ว",
};

export function OrderItemFulfillmentSelect({
  orderItemId,
  orderId,
  currentStatus,
}: {
  orderItemId: number;
  orderId: number;
  currentStatus: string | null;
}) {
  const router = useRouter();
  const value = currentStatus ?? "pending";

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const status = e.target.value as FulfillmentStatus;
    await updateOrderItemFulfillmentAction(orderItemId, orderId, status);
    router.refresh();
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
      aria-label="สถานะการจัดส่ง"
    >
      <option value="pending">{FULFILLMENT_LABELS.pending}</option>
      <option value="shipped">{FULFILLMENT_LABELS.shipped}</option>
      <option value="delivered">{FULFILLMENT_LABELS.delivered}</option>
    </select>
  );
}
