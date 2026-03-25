import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { getOrCreateWallet, getWalletTransactions } from "@/features/wallet/wallet.repo";
import { Wallet, ArrowUpCircle, ArrowDownCircle, RefreshCw, Plus } from "lucide-react";

const TYPE_INFO: Record<string, { label: string; color: string; icon: typeof ArrowUpCircle }> = {
  credit: { label: "เติมเงิน", color: "text-green-600", icon: ArrowUpCircle },
  debit: { label: "ใช้จ่าย", color: "text-red-600", icon: ArrowDownCircle },
  refund: { label: "คืนเงิน", color: "text-blue-600", icon: RefreshCw },
  adjustment: { label: "ปรับยอด", color: "text-muted-foreground", icon: ArrowUpCircle },
};

export default async function WalletPage() {
  const customer = await getCustomerSession();
  if (!customer) redirect("/customer-login?from=/account/wallet");

  const [wallet, transactions] = await Promise.all([
    getOrCreateWallet(customer.id),
    getWalletTransactions(customer.id),
  ]);

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="rounded-2xl bg-linear-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="h-5 w-5" />
          <span className="text-sm font-medium opacity-90">ยอด Wallet ของฉัน</span>
        </div>
        <div className="text-4xl font-bold tabular-nums">
          ฿{wallet.balance.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
        </div>
        <p className="mt-1 text-xs opacity-70">สามารถใช้ชำระคำสั่งซื้อได้โดยตรง</p>
        <Link
          href="/account/wallet/topup"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-4 py-2 text-sm font-medium hover:bg-white/30 transition"
        >
          <Plus className="h-4 w-4" />
          เติม Wallet
        </Link>
      </div>

      {/* Transactions */}
      <div>
        <h2 className="mb-3 font-semibold">ประวัติธุรกรรม</h2>
        {transactions.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            ยังไม่มีประวัติธุรกรรม
          </div>
        ) : (
          <ul className="space-y-2">
            {transactions.map((tx) => {
              const info = TYPE_INFO[tx.type] ?? TYPE_INFO.credit;
              const Icon = info.icon;
              const isPositive = tx.amount >= 0;
              return (
                <li
                  key={tx.id}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
                >
                  <div className={`shrink-0 ${info.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{info.label}</p>
                    <p className="text-xs text-muted-foreground">{tx.description}</p>
                    {tx.orderNumber && (
                      <p className="text-xs text-muted-foreground font-mono">Order #{tx.orderNumber}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold tabular-nums ${isPositive ? "text-green-600" : "text-red-600"}`}>
                      {isPositive ? "+" : ""}฿{Math.abs(tx.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      คงเหลือ ฿{tx.balanceAfter.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString("th-TH")}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
