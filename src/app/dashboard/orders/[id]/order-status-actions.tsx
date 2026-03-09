"use client";

import { useRouter } from "next/navigation";
import { updateOrderStatusAction } from "@/features/order/order.actions";
import { Button } from "@/components/ui/button";

const STATUS_LABELS: Record<string, string> = {
  pending: "รอชำระเงิน",
  paid: "ชำระแล้ว",
  completed: "คืนแล้ว",
  cancelled: "ยกเลิก",
};

/** คำสั่งเช่า: ชำระผ่าน Stripe; แอดมินเปลี่ยนได้เฉพาะ ยกเลิก / คืนแล้ว */
const NEXT_STATUS: Record<string, string[] | null> = {
  pending: ["cancelled"],
  paid: ["completed", "cancelled"],
  completed: null,
  cancelled: null,
};

type Status = "pending" | "paid" | "completed" | "cancelled";

export function OrderStatusActions({
  orderId,
  currentStatus,
}: {
  orderId: number;
  currentStatus: string;
}) {
  const router = useRouter();
  const options = NEXT_STATUS[currentStatus];

  async function handleStatus(s: Status) {
    await updateOrderStatusAction(orderId, s);
    router.refresh();
  }

  if (!options || options.length === 0) {
    return (
      <span className="text-sm text-muted-foreground">
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
          className={
            s === "cancelled"
              ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
              : ""
          }
        >
          {s === "cancelled" ? "ยกเลิกคำสั่ง" : s === "completed" ? "บันทึกว่าคืนแล้ว" : STATUS_LABELS[s]}
        </Button>
      ))}
    </div>
  );
}
