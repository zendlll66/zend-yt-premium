import Link from "next/link";
import { notFound } from "next/navigation";
import { findOrderById } from "@/features/order/order.repo";
import { Button } from "@/components/ui/button";
import { OrderStatusActions } from "./order-status-actions";

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
        </div>
        <OrderStatusActions orderId={order.id} currentStatus={order.status} />
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 font-medium">ข้อมูลลูกค้า</h2>
        <p className="text-sm">
          <span className="font-medium">{order.customerName}</span>
          <br />
          {order.customerEmail}
          {order.customerPhone && (
            <>
              <br />
              {order.customerPhone}
            </>
          )}
        </p>
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
                    {item.modifiers.length > 0 && (
                      <ul className="mt-1 text-xs text-muted-foreground">
                        {item.modifiers.map((m, i) => (
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
