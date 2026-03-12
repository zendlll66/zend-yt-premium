import Link from "next/link";
import { Calendar, Package, Receipt, Truck } from "lucide-react";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { findOrdersByCustomerEmailWithItems } from "@/features/order/order.repo";
import type { OrderListItemWithItems } from "@/features/order/order.repo";
import { FulfillmentStepperReadOnly } from "@/components/fulfillment-stepper-readonly";
import { Button } from "@/components/ui/button";

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(d));
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function orderStatusLabel(status: string): { label: string; className: string } {
  switch (status) {
    case "paid":
      return { label: "ชำระเงินแล้ว", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" };
    case "completed":
      return { label: "ดำเนินการเสร็จสิ้น", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" };
    case "cancelled":
      return { label: "ยกเลิก", className: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400" };
    default:
      return { label: "รอชำระเงิน", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" };
  }
}

function formatItemDate(d: Date | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(d));
}

function RentalHistoryCard({ order }: { order: OrderListItemWithItems }) {
  const { label, className } = orderStatusLabel(order.status);
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 transition hover:bg-muted/50 overflow-hidden">
      <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Receipt className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-medium tracking-tight">
              <Link href={`/account/orders/${order.id}`} className="hover:underline">
                {order.orderNumber}
              </Link>
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(order.rentalStart)} – {formatDate(order.rentalEnd)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <p className="text-sm font-medium tabular-nums">
            {formatMoney(order.totalPrice)} ฿
          </p>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
            {label}
          </span>
        </div>
      </div>

      {order.items.length > 0 && (
        <div className="border-t border-border/60 bg-background/50 p-4">
          <p className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Truck className="h-3.5 w-3.5" />
            สถานะการจัดส่ง
          </p>
          <ul className="space-y-4">
            {order.items.map((item) => (
              <li key={item.id} className="rounded-lg border border-border/40 bg-muted/20 p-3">
                <p className="mb-2 text-sm font-medium">{item.productName}</p>
                <p className="mb-3 text-xs text-muted-foreground">
                  {formatItemDate(item.rentalStart)} – {formatItemDate(item.rentalEnd)} · จำนวน {item.quantity}
                </p>
                <FulfillmentStepperReadOnly currentStatus={item.fulfillmentStatus} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default async function AccountOrdersPage() {
  const customer = await getCustomerSession();
  if (!customer) return null;

  const orders = await findOrdersByCustomerEmailWithItems(customer.email, 20);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/account">← บัญชี</Link>
        </Button>
        <h1 className="mt-2 text-xl font-semibold">ประวัติการเช่า</h1>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <p className="mb-4 text-sm text-muted-foreground">
          รายการคำสั่งเช่าของคุณ สถานะการชำระเงิน และสถานะการจัดส่งแต่ละรายการ
        </p>
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-12 text-center">
            <Package className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">ยังไม่มีประวัติการเช่า</p>
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <Link href="/rent">ไปหน้ารายการเช่า</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => (
              <li key={order.id}>
                <RentalHistoryCard order={order} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
