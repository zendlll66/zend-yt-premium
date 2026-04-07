import Link from "next/link";
import { notFound } from "next/navigation";
import { findCustomerById } from "@/features/customer/customer.repo";
import { findOrdersByCustomerEmailWithItems } from "@/features/order/order.repo";
import { getOrCreateWallet, getWalletTransactions } from "@/features/wallet/wallet.repo";
import { WALLET_FEATURE_ENABLED } from "@/lib/feature-flags";
import { Button } from "@/components/ui/button";
import { AddCreditForm } from "./add-credit-form";

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
  const wallet = WALLET_FEATURE_ENABLED ? await getOrCreateWallet(customerId) : null;
  const walletTxs = WALLET_FEATURE_ENABLED ? await getWalletTransactions(customerId) : [];

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/customers">← กลับรายการลูกค้า</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/customers/${customerId}/inventory`}>Inventory</Link>
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

      {WALLET_FEATURE_ENABLED && wallet && (
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-medium">Wallet</h2>
              <p className="text-2xl font-bold text-green-600 tabular-nums">
                ฿{wallet.balance.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <AddCreditForm customerId={customerId} />
          </div>
          {walletTxs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-3 py-2 text-left">วันที่</th>
                    <th className="px-3 py-2 text-left">ประเภท</th>
                    <th className="px-3 py-2 text-left">คำอธิบาย</th>
                    <th className="px-3 py-2 text-right">จำนวน</th>
                    <th className="px-3 py-2 text-right">คงเหลือ</th>
                  </tr>
                </thead>
                <tbody>
                  {walletTxs.slice(0, 5).map((tx) => (
                    <tr key={tx.id} className="border-b last:border-0">
                      <td className="px-3 py-1.5 text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString("th-TH")}</td>
                      <td className="px-3 py-1.5">{tx.type}</td>
                      <td className="px-3 py-1.5">{tx.description}</td>
                      <td className={`px-3 py-1.5 text-right tabular-nums font-medium ${tx.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {tx.amount >= 0 ? "+" : ""}฿{Math.abs(tx.amount).toLocaleString("th-TH")}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums">฿{tx.balanceAfter.toLocaleString("th-TH")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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

