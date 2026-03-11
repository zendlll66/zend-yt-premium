import Link from "next/link";
import { findOrdersWithFulfillment } from "@/features/order/order.repo";
import { Button } from "@/components/ui/button";

const STATUS_LABELS: Record<string, string> = {
  pending: "รอชำระเงิน",
  paid: "ชำระแล้ว",
  completed: "คืนแล้ว",
  cancelled: "ยกเลิก",
};

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

function formatFulfillment(fulfillment: { pending: number; shipped: number; delivered: number }) {
  const { pending, shipped, delivered } = fulfillment;
  const total = pending + shipped + delivered;
  if (total === 0) return "—";
  if (delivered === total) return "ครบแล้ว";
  const parts: string[] = [];
  if (pending > 0) parts.push(`รอ ${pending}`);
  if (shipped > 0) parts.push(`ส่ง ${shipped}`);
  if (delivered > 0) parts.push(`ถึง ${delivered}`);
  return parts.join(" · ");
}

export default async function OrdersPage() {
  const orders = await findOrdersWithFulfillment();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">รายการคำสั่งเช่า</h1>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 font-medium">เลขที่</th>
                <th className="px-4 py-3 font-medium">ลูกค้า</th>
                <th className="px-4 py-3 font-medium">วันที่เช่า</th>
                <th className="px-4 py-3 font-medium">สถานะ</th>
                <th className="px-4 py-3 font-medium">สถานะขนส่ง</th>
                <th className="px-4 py-3 font-medium">ยอดรวม</th>
                <th className="px-4 py-3 text-right font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    ยังไม่มีคำสั่งเช่า
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-mono text-sm">{o.orderNumber}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{o.customerName}</span>
                      <span className="block text-xs text-muted-foreground">{o.customerEmail}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(o.rentalStart)} – {formatDate(o.rentalEnd)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          o.status === "cancelled"
                            ? "text-muted-foreground"
                            : o.status === "paid" || o.status === "completed"
                              ? "text-green-600 dark:text-green-400"
                              : "text-amber-600 dark:text-amber-400"
                        }
                      >
                        {STATUS_LABELS[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="text-xs">{formatFulfillment(o.fulfillment)}</span>
                    </td>
                    <td className="px-4 py-3">{formatMoney(o.totalPrice)} ฿</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/orders/${o.id}`}>รายละเอียด</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/orders/${o.id}/tracking`}>ติดตามการส่ง</Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
