"use client";

import { useRouter } from "next/navigation";
import { updateOrderStatusAction } from "@/features/order/order.actions";
import type { KitchenOrder } from "@/features/order/order.repo";

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
};

export function KitchenOrderCards({ orders }: { orders: KitchenOrder[] }) {
  const router = useRouter();

  async function handleStart(orderId: number) {
    await updateOrderStatusAction(orderId, "preparing");
    router.refresh();
  }

  async function handleDone(orderId: number) {
    await updateOrderStatusAction(orderId, "ready");
    router.refresh();
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/20 p-12 text-center text-muted-foreground">
        ไม่มีบิลที่รอจัดเตรียม
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
              <p className="font-mono font-semibold">#{order.orderNumber}</p>
              <p className="text-muted-foreground text-sm">
                โต๊ะ {order.tableNumber ?? "—"} · {formatTime(order.createdAt)}
              </p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${order.status === "preparing" ? "bg-amber-500/20 text-amber-700 dark:text-amber-400" : "bg-muted text-muted-foreground"}`}
            >
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>

          <ul className="mb-4 flex-1 space-y-2 text-sm">
            {order.items.map((item) => (
              <li key={item.id}>
                <span className="font-medium">
                  {item.productName} × {item.quantity}
                </span>
                {item.modifiers.length > 0 && (
                  <ul className="ml-3 mt-0.5 text-muted-foreground">
                    {item.modifiers.map((m, i) => (
                      <li key={i}>
                        {m.modifierName}
                        {m.price > 0 ? ` +${m.price}฿` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>

          <div className="flex gap-2 border-t pt-3">
            {order.status === "pending" && (
              <button
                type="button"
                onClick={() => handleStart(order.id)}
                className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Start
              </button>
            )}
            {order.status === "preparing" && (
              <button
                type="button"
                onClick={() => handleDone(order.id)}
                className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Done
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
