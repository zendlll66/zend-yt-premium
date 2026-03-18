import Link from "next/link";
import { notFound } from "next/navigation";
import { findOrderById } from "@/features/order/order.repo";
import { Button } from "@/components/ui/button";
import { OrderStatusActions } from "./order-status-actions";
import { getVisibleModifiers } from "@/lib/customer-account-credentials";
import { findCustomerAccountsByOrderId } from "@/features/youtube/youtube-stock.repo";
import { updateCustomerAccountsStatusByOrderIdAction } from "@/features/youtube/youtube-stock.actions";
import { parseInventoryRenewalTargetId } from "@/lib/inventory-renewal";
import { Check } from "lucide-react";

function formatDate(d: Date | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function getProductTypeLabel(productType: string) {
  if (productType === "individual") return "Individual";
  if (productType === "family") return "Family";
  if (productType === "invite") return "Invite Link";
  if (productType === "customer_account") return "Customer Account";
  return productType;
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orderId = parseInt(id, 10);
  if (!Number.isFinite(orderId)) notFound();

  const order = await findOrderById(orderId);
  if (!order) notFound();

  const customerAccounts =
    order.productType === "customer_account"
      ? await findCustomerAccountsByOrderId(order.id)
      : [];
  const counts = {
    pending: customerAccounts.filter((a) => a.status === "pending").length,
    processing: customerAccounts.filter((a) => a.status === "processing").length,
    done: customerAccounts.filter((a) => a.status === "done").length,
  };
  const stepIndex =
    counts.done > 0 ? 3 : counts.processing > 0 ? 2 : counts.pending > 0 ? 1 : 0;

  const customerAccountStageLabel =
    order.productType !== "customer_account"
      ? null
      : stepIndex === 1
        ? "รอดำเนินการ"
        : stepIndex === 2
          ? "กำลังดำเนินการ"
          : stepIndex === 3
            ? "subscribed"
            : "-";

  const renewedInventoryId =
    order.items
      .flatMap((i) => i.modifiers)
      .map((m) => parseInventoryRenewalTargetId(m.modifierName))
      .find((v): v is number => v != null) ?? null;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/orders">← รายการคำสั่งซื้อ</Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-mono text-xl font-semibold">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            สร้างเมื่อ {formatDate(order.createdAt)}
          </p>
          <p className="text-sm text-muted-foreground">
            ประเภทสินค้า: {getProductTypeLabel(order.productType)}
          </p>
          {renewedInventoryId && (
            <p className="mt-1 text-xs text-muted-foreground">
              ต่ออายุ Inventory:{" "}
              <span className="font-medium tabular-nums">{renewedInventoryId}</span>
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-col items-end gap-2">
            <OrderStatusActions orderId={order.id} currentStatus={order.status} />
            {customerAccountStageLabel && (
              <div className="text-xs text-muted-foreground">
                Customer Account: <span className="font-medium">{customerAccountStageLabel}</span>
              </div>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/orders/${order.id}/edit`}>แก้ไขคำสั่งซื้อ</Link>
        </Button>
      </div>

      {order.paymentSlipImageUrl && (
        <div className="rounded-xl border bg-card p-4">
          <h2 className="mb-3 font-medium">สลิปการชำระเงิน</h2>
          <a
            href={`/api/r2-url?key=${encodeURIComponent(order.paymentSlipImageUrl)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-block"
          >
            <img
              src={`/api/r2-url?key=${encodeURIComponent(order.paymentSlipImageUrl)}`}
              alt="สลิปการชำระเงิน"
              className="max-h-[420px] rounded-lg border object-contain"
            />
          </a>
        </div>
      )}

      <div className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 font-medium">ลูกค้าที่ใช้</h2>
        <div className="text-sm">
          {order.customerIdResolved ? (
            <Link
              href={`/dashboard/customers/${order.customerIdResolved}`}
              className="mb-2 inline-flex items-center gap-2 rounded-full border px-2 py-1.5 text-xs hover:bg-muted"
            >
              {order.customerLinePictureUrl ? (
                <img
                  src={order.customerLinePictureUrl.startsWith("http") ? order.customerLinePictureUrl : `/api/r2-url?key=${encodeURIComponent(order.customerLinePictureUrl)}`}
                  alt=""
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px]">
                  U
                </span>
              )}
              <span>{order.customerLineDisplayName ?? order.customerName}</span>
              {(order.customerLineDisplayName ?? order.customerLinePictureUrl) && (
                <span className="shrink-0 rounded bg-[#06C755]/15 px-1.5 py-0.5 text-[10px] font-medium text-[#06C755]">
                  LINE
                </span>
              )}
            </Link>
          ) : null}
          <p>
            <span className="font-medium">{order.customerName}</span>
            <br />
            <span className="text-muted-foreground">{order.customerEmail}</span>
            {order.customerPhone && (
              <>
                <br />
                <span className="text-muted-foreground">{order.customerPhone}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {order.items.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 font-medium">สินค้า</th>
                <th className="px-4 py-3 font-medium text-right">ราคา/จำนวน</th>
                <th className="px-4 py-3 font-medium text-right">รวม</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{item.productName}</div>
                    {getVisibleModifiers(item.modifiers).length > 0 && (
                      <ul className="mt-1 text-xs text-muted-foreground">
                        {getVisibleModifiers(item.modifiers).map((m, i) => (
                          <li key={i}>
                            {m.modifierName}
                            {m.price > 0 ? ` +${formatMoney(m.price)}` : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatMoney(item.price)} × {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatMoney(item.totalPrice)} ฿
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {order.productType === "customer_account" && (
        <section className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Customer Account Workflow</h2>

          {/* Big stepper bar */}
          <div className="mb-4 flex items-center gap-3">
            {[
              { idx: 1, key: "pending", label: "รอดำเนินการ" },
              { idx: 2, key: "processing", label: "กำลังดำเนินการ" },
              { idx: 3, key: "done", label: "subscribed" },
            ].map((s, i, arr) => {
              const isDone = stepIndex > s.idx;
              const isActive = stepIndex === s.idx;

              return (
                <div key={s.key} className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className={[
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                      isDone
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : isActive
                          ? "border-primary bg-primary text-white"
                          : "border-neutral-300 bg-white text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400",
                    ].join(" ")}
                  >
                    {isDone ? <Check className="h-4 w-4" /> : s.idx}
                  </div>

                  <div className="min-w-0">
                    <div
                      className={[
                        "truncate text-sm font-medium",
                        isActive ? "text-foreground" : "text-muted-foreground",
                      ].join(" ")}
                    >
                      {s.label}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {s.key === "pending"
                        ? `${counts.pending} บัญชี`
                        : s.key === "processing"
                          ? `${counts.processing} บัญชี`
                          : `${counts.done} บัญชี`}
                    </div>
                  </div>

                  {i < arr.length - 1 && (
                    <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Sections (each step has its own action card) */}
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { idx: 1, key: "pending", title: "รอดำเนินการ", disabledReason: "เดินหน้าต่อได้" },
              { idx: 2, key: "processing", title: "กำลังดำเนินการ", disabledReason: "เดินหน้าต่อได้" },
              { idx: 3, key: "done", title: "subscribed", disabledReason: "เดินหน้าต่อได้" },
            ].map((step) => {
              const isActive = stepIndex === step.idx;
              const canSelect = true;

              return (
                <div
                  key={step.key}
                  className={[
                    "rounded-xl border p-4",
                    isActive ? "border-primary/60 bg-primary/5" : "bg-background",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">{step.title}</div>
                    {step.idx < stepIndex && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                        สำเร็จแล้ว
                      </span>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground">
                    {step.key === "pending"
                      ? `${counts.pending} บัญชี`
                      : step.key === "processing"
                        ? `${counts.processing} บัญชี`
                        : `${counts.done} บัญชี`}
                  </div>

                  <form
                    action={updateCustomerAccountsStatusByOrderIdAction}
                    className="mt-3"
                  >
                    <input type="hidden" name="orderId" value={order.id} />
                    <button
                      type="submit"
                      name="status"
                      value={step.key}
                      disabled={!canSelect}
                      className={[
                        "w-full rounded-md border px-3 py-2 text-xs font-medium",
                        canSelect
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-muted-foreground/30 bg-muted/10 text-muted-foreground cursor-not-allowed",
                      ].join(" ")}
                    >
                      อัปเดตเป็น {step.title}
                    </button>
                  </form>
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-xs text-muted-foreground">
            อัปเดตสถานะของ <b>customer_accounts</b> ที่ผูกกับออเดอร์นี้ (ไม่ใช่ <b>orders.status</b>)
          </div>
        </section>
      )}

      <div className="flex flex-col gap-1 rounded-xl border bg-muted/30 px-4 py-3 text-right">
        {order.depositAmount > 0 && (
          <p className="text-sm text-muted-foreground">
            มัดจำ {formatMoney(order.depositAmount)} ฿
          </p>
        )}
        <p className="font-semibold">ยอดรวมทั้งสิ้น {formatMoney(order.totalPrice)} ฿</p>
        {order.stripePaymentIntentId && (
          <p className="text-xs text-muted-foreground">
            ชำระผ่าน Stripe · {order.stripePaymentStatus ?? "paid"}
          </p>
        )}
      </div>
    </div>
  );
}
