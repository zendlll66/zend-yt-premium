import { Check, X, Clock } from "lucide-react"

type OrderStatus =
  | "pending"
  | "wait"
  | "paid"
  | "fulfilled"
  | "completed"
  | "cancelled"
  | "refunded"

const FLOW: OrderStatus[] = ["pending", "wait", "paid", "fulfilled", "completed"]

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "รอยืนยัน",
  wait: "รอชำระเงิน",
  paid: "ชำระแล้ว",
  fulfilled: "ส่งมอบแล้ว",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
  refunded: "คืนเงิน",
}

function getStepState(step: OrderStatus, current: OrderStatus) {
  if (current === "cancelled" || current === "refunded") return "inactive"
  const currentIdx = FLOW.indexOf(current)
  const stepIdx = FLOW.indexOf(step)
  if (stepIdx < currentIdx) return "done"
  if (stepIdx === currentIdx) return "active"
  return "upcoming"
}

export function OrderTimeline({ status }: { status: OrderStatus }) {
  const isTerminal = status === "cancelled" || status === "refunded"

  return (
    <div className="rounded-xl border bg-card p-4">
      <h2 className="mb-4 font-medium">สถานะคำสั่งซื้อ</h2>

      {isTerminal ? (
        <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${
          status === "cancelled"
            ? "bg-red-500/10 text-red-600 dark:text-red-400"
            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
        }`}>
          <X className="h-4 w-4" />
          {STATUS_LABELS[status]}
        </div>
      ) : (
        <ol className="flex items-start gap-0">
          {FLOW.map((step, i) => {
            const state = getStepState(step, status)
            return (
              <li key={step} className="flex flex-1 flex-col items-center">
                <div className="flex w-full items-center">
                  {/* connector left */}
                  <div className={`h-0.5 flex-1 ${i === 0 ? "invisible" : state === "upcoming" ? "bg-muted" : "bg-brand-accent"}`} />
                  {/* dot */}
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                    state === "done"
                      ? "border-brand-accent bg-brand-accent text-white"
                      : state === "active"
                        ? "border-brand-accent bg-card text-brand-accent"
                        : "border-muted bg-muted text-muted-foreground"
                  }`}>
                    {state === "done" ? <Check className="h-3.5 w-3.5" /> : state === "active" ? <Clock className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  {/* connector right */}
                  <div className={`h-0.5 flex-1 ${i === FLOW.length - 1 ? "invisible" : state === "upcoming" ? "bg-muted" : "bg-brand-accent"}`} />
                </div>
                <span className={`mt-1.5 text-center text-[11px] leading-tight ${
                  state === "active" ? "font-semibold text-brand-accent" : state === "done" ? "text-muted-foreground" : "text-muted-foreground/50"
                }`}>
                  {STATUS_LABELS[step]}
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
