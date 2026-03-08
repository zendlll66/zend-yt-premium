"use client";

import { useRouter } from "next/navigation";
import { updateOrderStatusAction } from "@/features/order/order.actions";
import { Button } from "@/components/ui/button";

const STATUS_LABELS: Record<string, string> = {
  pending: "รอจัดเตรียม",
  preparing: "กำลังจัดเตรียม",
  ready: "พร้อมเสิร์ฟ",
  served: "จัดเสิร์ฟแล้ว",
  paid: "ชำระแล้ว",
  cancelled: "ยกเลิก",
};

const NEXT_STATUS: Record<string, string[] | null> = {
  pending: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["served", "cancelled"],
  served: ["paid", "cancelled"],
  paid: null,
  cancelled: null,
};

type Status = "pending" | "preparing" | "ready" | "served" | "paid" | "cancelled";

export function OrderStatusActions({
  orderId,
  currentStatus,
}: {
  orderId: number;
  currentStatus: string;
}) {
  const router = useRouter();
  const options = NEXT_STATUS[currentStatus];

  async function handleStatus(status: Status) {
    await updateOrderStatusAction(orderId, status);
    router.refresh();
  }

  if (!options || options.length === 0) {
    return (
      <span className="text-muted-foreground text-sm">
        {STATUS_LABELS[currentStatus] ?? currentStatus}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((s) => (
        <Button
          key={s}
          variant={s === "cancelled" ? "outline" : "default"}
          size="sm"
          onClick={() => handleStatus(s as Status)}
          className={s === "cancelled" ? "text-destructive hover:bg-destructive/10 hover:text-destructive" : ""}
        >
          {s === "cancelled" ? "ยกเลิกบิล" : `→ ${STATUS_LABELS[s]}`}
        </Button>
      ))}
    </div>
  );
}
