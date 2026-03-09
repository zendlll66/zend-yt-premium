import Link from "next/link";
import { notFound } from "next/navigation";
import { findOrderById } from "@/features/order/order.repo";
import { Button } from "@/components/ui/button";
import { OrderStatusActions } from "./order-status-actions";

const BILL_STATUS_LABELS: Record<string, string> = {
  pending: "รอจัดเตรียม",
  preparing: "กำลังจัดเตรียม",
  ready: "พร้อมเสิร์ฟ",
  served: "จัดเสิร์ฟแล้ว",
  paid: "ชำระแล้ว",
  cancelled: "ยกเลิก",
};

const KITCHEN_STATUS_LABELS: Record<string, string> = {
  pending: "รอจัดเตรียม",
  preparing: "กำลังจัดเตรียม",
  ready: "พร้อมเสิร์ฟ",
  served: "จัดเสิร์ฟแล้ว",
};

function formatDate(d: Date | null) {
  if (!d) return "-";
  return new Date(d).toLocaleString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
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
          <Link href="/dashboard/orders">← รายการบิล</Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold font-mono">{order.orderNumber}</h1>
          <p className="text-muted-foreground text-sm">
            {order.tableNumber ? `โต๊ะ ${order.tableNumber}` : "ไม่มีโต๊ะ"} · สร้างเมื่อ {formatDate(order.createdAt)}
          </p>
        </div>
        <OrderStatusActions orderId={order.id} currentStatus={order.status} />
      </div>
      {!["paid", "cancelled"].includes(order.status) && (
        <p className="text-muted-foreground text-xs">
          สถานะรายการสั่ง (รอจัดเตรียม → พร้อมเสิร์ฟ) จัดที่หน้า Kitchen
        </p>
      )}

      {order.kitchenOrders.length > 0 ? (
        <div className="space-y-6">
          {order.kitchenOrders.map((ko) => (
            <div key={ko.id} className="rounded-xl border bg-card overflow-hidden">
              <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
                <h2 className="font-medium">
                  รายการสั่งที่ {ko.sequence}
                  {ko.id === 0 ? " (เก่า)" : ""}
                </h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                  {KITCHEN_STATUS_LABELS[ko.status] ?? ko.status}
                </span>
              </div>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 font-medium">สินค้า</th>
                    <th className="px-4 py-3 font-medium text-right">ราคา/จำนวน</th>
                    <th className="px-4 py-3 font-medium text-right">รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {ko.items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.productName}</div>
                        {item.modifiers.length > 0 && (
                          <ul className="mt-1 text-muted-foreground text-xs">
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
          ))}
        </div>
      ) : (
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
                      <ul className="mt-1 text-muted-foreground text-xs">
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

      <div className="rounded-xl border bg-muted/30 px-4 py-3 text-right font-semibold">
        ยอดรวมทั้งบิล {formatMoney(order.totalPrice)} ฿
      </div>
    </div>
  );
}
