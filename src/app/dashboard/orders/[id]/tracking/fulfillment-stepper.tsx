"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrderItemFulfillmentAction } from "@/features/order/order.actions";
import type { FulfillmentStatus } from "@/db/schema/order.schema";
import { Check } from "lucide-react";

const STEPS: { value: FulfillmentStatus; label: string }[] = [
  { value: "pending", label: "รอจัดส่ง" },
  { value: "shipped", label: "ส่งแล้ว" },
  { value: "delivered", label: "ส่งถึงแล้ว" },
];

export function FulfillmentStepper({
  orderItemId,
  orderId,
  currentStatus,
  showDropdown = false,
}: {
  orderItemId: number;
  orderId: number;
  currentStatus: string | null;
  showDropdown?: boolean;
}) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const value = (currentStatus ?? "pending") as FulfillmentStatus;
  const currentIndex = Math.max(
    0,
    STEPS.findIndex((s) => s.value === value)
  );

  async function setStatus(status: FulfillmentStatus) {
    if (updating) return;
    setUpdating(true);
    try {
      await updateOrderItemFulfillmentAction(orderItemId, orderId, status);
      router.refresh();
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="w-full">
      {/* เส้น track และ progress */}
      <div className="relative flex w-full items-stretch">
        {/* เส้นพื้นหลัง (เต็มทั้งเส้น) */}
        <div
          className="absolute left-0 right-0 top-5 h-1 -translate-y-1/2 rounded-full bg-muted"
          aria-hidden
        />
        {/* เส้นที่เติมถึงขั้นตอนปัจจุบัน */}
        <div
          className="absolute left-0 top-5 h-1 -translate-y-1/2 rounded-full bg-primary transition-all duration-300"
          style={{
            width: currentIndex === 0 ? "0%" : `${(currentIndex / (STEPS.length - 1)) * 100}%`,
          }}
          aria-hidden
        />

        {STEPS.map((step, index) => {
          const isActive = step.value === value;
          const isPast = currentIndex > index;
          const isClickable = !updating;

          return (
            <div
              key={step.value}
              className="relative z-10 flex flex-1 flex-col items-center"
            >
              <button
                type="button"
                onClick={() => isClickable && setStatus(step.value)}
                disabled={!isClickable}
                className="group flex flex-col items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label={`ตั้งเป็น ${step.label}`}
                aria-pressed={isActive}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition-all ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground shadow-md scale-110"
                      : isPast
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/50 bg-background text-muted-foreground group-hover:border-primary/50 group-hover:bg-primary/5"
                  }`}
                >
                  {isPast ? <Check className="h-5 w-5" strokeWidth={2.5} /> : index + 1}
                </span>
                <span
                  className={`text-xs font-medium text-center max-w-18 ${
                    isActive
                      ? "text-foreground"
                      : isPast
                        ? "text-primary"
                        : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {showDropdown && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/50 pt-4">
          <label htmlFor={`fulfillment-select-${orderItemId}`} className="text-sm font-medium text-muted-foreground">
            เปลี่ยนสถานะ:
          </label>
          <select
            id={`fulfillment-select-${orderItemId}`}
            value={value}
            onChange={(e) => setStatus(e.target.value as FulfillmentStatus)}
            disabled={updating}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
          >
            {STEPS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {updating && (
        <p className="mt-2 text-center text-xs text-muted-foreground">กำลังอัปเดต…</p>
      )}
    </div>
  );
}
