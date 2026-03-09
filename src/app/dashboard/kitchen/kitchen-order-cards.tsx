"use client";

import { useRouter } from "next/navigation";
import {
  updateKitchenOrderStatusAction,
  updateOrderItemStatusAction,
} from "@/features/order/order.actions";
import type { KitchenOrder, KitchenOrderItem } from "@/features/order/order.repo";

function formatTime(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_LABELS: Record<string, string> = {
  pending: "รอจัดเตรียม",
  preparing: "กำลังจัดเตรียม",
  ready: "พร้อมเสิร์ฟ",
  served: "จัดเสิร์ฟแล้ว",
};

function ItemStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`shrink-0 rounded-full px-1.5 py-0.5 text-xs ${
        status === "preparing"
          ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
          : status === "ready"
            ? "bg-green-500/20 text-green-700 dark:text-green-400"
            : "bg-muted text-muted-foreground"
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function OrderItemRow({
  item,
  onItemStatus,
}: {
  item: KitchenOrderItem;
  onItemStatus: (itemId: number, status: "preparing" | "ready") => void;
}) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-2 rounded border bg-muted/30 px-2 py-1.5">
      <div className="min-w-0 flex-1">
        <span className="font-medium">
          {item.productName} × {item.quantity}
        </span>
        {item.modifiers.length > 0 && (
          <ul className="ml-3 mt-0.5 text-muted-foreground text-xs">
            {item.modifiers.map((m, i) => (
              <li key={i}>
                {m.modifierName}
                {m.price > 0 ? ` +${m.price}฿` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <ItemStatusBadge status={item.status} />
        {item.status === "pending" && (
          <button
            type="button"
            onClick={() => onItemStatus(item.id, "preparing")}
            className="rounded bg-amber-500/80 px-2 py-0.5 text-xs font-medium text-white hover:bg-amber-500"
          >
            กำลังจัด
          </button>
        )}
        {(item.status === "pending" || item.status === "preparing") && (
          <button
            type="button"
            onClick={() => onItemStatus(item.id, "ready")}
            className="rounded bg-green-600/90 px-2 py-0.5 text-xs font-medium text-white hover:bg-green-600"
          >
            พร้อม
          </button>
        )}
      </div>
    </li>
  );
}

type Props = {
  orders: KitchenOrder[];
  stationId: number | null;
  stationName: string | null;
};

export function KitchenOrderCards({ orders, stationId, stationName }: Props) {
  const router = useRouter();
  const isAllStations = stationId == null;

  async function handleOrderStart(kitchenOrderId: number) {
    await updateKitchenOrderStatusAction(kitchenOrderId, "preparing", isAllStations ? undefined : stationId ?? undefined);
    router.refresh();
  }

  async function handleOrderReady(kitchenOrderId: number) {
    await updateKitchenOrderStatusAction(kitchenOrderId, "ready", isAllStations ? undefined : stationId ?? undefined);
    router.refresh();
  }

  async function handleOrderServed(kitchenOrderId: number) {
    await updateKitchenOrderStatusAction(kitchenOrderId, "served", isAllStations ? undefined : stationId ?? undefined);
    router.refresh();
  }

  async function handleItemStatus(orderItemId: number, status: "preparing" | "ready") {
    await updateOrderItemStatusAction(orderItemId, status);
    router.refresh();
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/20 p-12 text-center text-muted-foreground">
        {stationName
          ? `ไม่มีรายการของ Station: ${stationName}`
          : "ไม่มีรายการสั่งที่รอจัดเตรียม"}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className="flex flex-col rounded-xl border bg-card p-4 shadow-sm"
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="font-mono font-semibold">
                #{order.orderNumber}
                {order.sequence > 1 ? ` (สั่งที่ ${order.sequence})` : ""}
              </p>
              <p className="text-muted-foreground text-sm">
                โต๊ะ {order.tableNumber ?? "—"} · {formatTime(order.createdAt)}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                order.status === "preparing"
                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                  : order.status === "ready"
                    ? "bg-green-500/20 text-green-700 dark:text-green-400"
                    : order.status === "served"
                      ? "bg-muted text-muted-foreground"
                      : "bg-muted text-muted-foreground"
              }`}
            >
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>

          <ul className="mb-4 flex-1 space-y-2 text-sm">
            {order.items.map((item) => (
              <OrderItemRow
                key={item.id}
                item={item}
                onItemStatus={handleItemStatus}
              />
            ))}
          </ul>

          <div className="space-y-2 border-t pt-3">
            <p className="text-muted-foreground text-xs">
              {isAllStations
                ? "เปลี่ยนทั้งออเดอร์ (ทุกรายการทุก station):"
                : `เปลี่ยนทั้งหมดของ Station นี้ (${stationName ?? ""}):`}
            </p>
            <div className="flex flex-wrap gap-2">
              {order.status === "pending" && (
                <button
                  type="button"
                  onClick={() => handleOrderStart(order.id)}
                  className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  {isAllStations ? "กำลังจัดเตรียม (ทั้งหมด)" : "กำลังจัดเตรียม (ของ station นี้)"}
                </button>
              )}
              {order.status === "preparing" && (
                <button
                  type="button"
                  onClick={() => handleOrderReady(order.id)}
                  className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  {isAllStations ? "พร้อมเสิร์ฟ (ทั้งหมด)" : "พร้อมเสิร์ฟ (ของ station นี้)"}
                </button>
              )}
              {order.status === "ready" && (
                <button
                  type="button"
                  onClick={() => handleOrderServed(order.id)}
                  className="flex-1 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/80"
                >
                  {isAllStations ? "จัดเสิร์ฟแล้ว" : "จัดเสิร์ฟแล้ว (ของ station นี้)"}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
