import Link from "next/link";
import { notFound } from "next/navigation";
import { Receipt } from "lucide-react";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { findOrderById } from "@/features/order/order.repo";
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
    case "fulfilled":
      return { label: "จัดส่งสำเร็จ", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" };
    case "completed":
      return { label: "ดำเนินการเสร็จสิ้น", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" };
    case "cancelled":
      return { label: "ยกเลิก", className: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400" };
    default:
      return { label: "รอชำระเงิน", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" };
  }
}

function getProductTypeLabel(productType: string) {
  if (productType === "individual") return "Individual";
  if (productType === "family") return "Family";
  if (productType === "invite") return "Invite Link";
  if (productType === "customer_account") return "Customer Account";
  return productType;
}

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const customer = await getCustomerSession();
  if (!customer) return null;

  const { id } = await params;
  const orderId = parseInt(id, 10);
  if (!Number.isFinite(orderId)) notFound();

  const order = await findOrderById(orderId);
  if (!order || order.customerEmail !== customer.email) notFound();

  const { label, className } = orderStatusLabel(order.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/account/orders">← ประวัติคำสั่งซื้อ</Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border/60 bg-muted/30 overflow-hidden">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Receipt className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-medium tracking-tight">{order.orderNumber}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                <span>ประเภท: {getProductTypeLabel(order.productType)}</span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <p className="text-sm font-medium tabular-nums">
              {formatMoney(Number(order.totalPrice))} ฿
            </p>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
              {label}
            </span>
          </div>
        </div>

        {order.items.length > 0 && (
          <div className="border-t border-border/60 bg-background/50 p-4">
            <p className="mb-3 text-xs font-medium text-muted-foreground">รายการสินค้า</p>
            <ul className="space-y-2">
              {order.items.map((item) => (
                <li key={item.id} className="rounded-lg border border-border/40 bg-muted/20 p-3 text-sm">
                  {item.productName} · จำนวน {item.quantity}
                  {item.modifiers.length > 0 && (
                    <span className="text-muted-foreground"> · {item.modifiers.map((m) => m.modifierName).join(", ")}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">รายละเอียดออเดอร์</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">ยอดรวม</dt>
            <dd>{formatMoney(Number(order.totalPrice))} ฿</dd>
          </div>
          {order.depositAmount != null && Number(order.depositAmount) > 0 && (
            <div>
              <dt className="text-muted-foreground">มัดจำ</dt>
              <dd>{formatMoney(Number(order.depositAmount))} ฿</dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground">ชื่อ-นามสกุล</dt>
            <dd>{order.customerName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">อีเมล</dt>
            <dd>{order.customerEmail}</dd>
          </div>
          {order.customerPhone && (
            <div>
              <dt className="text-muted-foreground">เบอร์โทร</dt>
              <dd>{order.customerPhone}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
