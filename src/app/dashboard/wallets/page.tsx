import Link from "next/link";
import { redirect } from "next/navigation";
import { listWalletsAdmin } from "@/features/wallet/wallet.repo";
import { WALLET_FEATURE_ENABLED } from "@/lib/feature-flags";

export default async function WalletsPage() {
  if (!WALLET_FEATURE_ENABLED) redirect("/dashboard");

  const wallets = await listWalletsAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Wallet ลูกค้า</h1>
        <p className="text-sm text-muted-foreground">ยอดคงเหลือ wallet ของลูกค้าทุกราย</p>
      </div>

      {wallets.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          ยังไม่มีข้อมูล wallet
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">ลูกค้า</th>
                <th className="px-4 py-3 text-left font-medium">อีเมล</th>
                <th className="px-4 py-3 text-right font-medium">ยอดคงเหลือ</th>
                <th className="px-4 py-3 text-left font-medium">อัปเดตล่าสุด</th>
                <th className="px-4 py-3 text-right font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {wallets.map((w) => (
                <tr key={w.walletId} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/dashboard/customers/${w.customerId}`}
                      className="hover:underline"
                    >
                      {w.customerName ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{w.customerEmail}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    <span className={w.balance > 0 ? "text-green-600" : "text-muted-foreground"}>
                      ฿{w.balance.toLocaleString("th-TH")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(w.updatedAt).toLocaleDateString("th-TH")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/customers/${w.customerId}`}
                      className="text-xs text-primary hover:underline"
                    >
                      ดูรายละเอียด →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
