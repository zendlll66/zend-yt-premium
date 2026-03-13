import Link from "next/link";
import { notFound } from "next/navigation";
import { findCustomerById } from "@/features/customer/customer.repo";
import { findOrdersByCustomerEmailWithItems } from "@/features/order/order.repo";
import { Button } from "@/components/ui/button";

function formatDate(d: Date | null) {
  if (!d) return "-";
  return new Date(d).toLocaleString("th-TH");
}

export default async function DashboardCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customerId = Number(id);
  if (!Number.isFinite(customerId)) notFound();

  const customer = await findCustomerById(customerId);
  if (!customer) notFound();

  const orders = await findOrdersByCustomerEmailWithItems(customer.email, 100);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/customers">← กลับรายการลูกค้า</Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3">
          {customer.linePictureUrl ? (
            <img src={customer.linePictureUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-xs">USER</div>
          )}
          <div>
            <h1 className="text-xl font-semibold">{customer.lineDisplayName ?? customer.name}</h1>
            <p className="text-sm text-muted-foreground">{customer.email}</p>
            <p className="text-xs text-muted-foreground">สมัครเมื่อ {formatDate(customer.createdAt)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="border-b px-4 py-3">
          <h2 className="font-medium">ประวัติคำสั่งซื้อ</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2">เลขที่ออเดอร์</th>
                <th className="px-4 py-2">ประเภท</th>
                <th className="px-4 py-2">สถานะ</th>
                <th className="px-4 py-2">ยอด</th>
                <th className="px-4 py-2 text-right">ดูรายละเอียด</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    ยังไม่มีคำสั่งซื้อ
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-mono">{order.orderNumber}</td>
                    <td className="px-4 py-2">{order.productType}</td>
                    <td className="px-4 py-2">{order.status}</td>
                    <td className="px-4 py-2">{order.totalPrice}</td>
                    <td className="px-4 py-2 text-right">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/orders/${order.id}`}>เปิด</Link>
                      </Button>
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

