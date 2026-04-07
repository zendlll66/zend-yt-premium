import { redirect } from "next/navigation";
import { listAllTopupRequests } from "@/features/wallet/wallet-topup.repo";
import { TopupApproveButton, TopupRejectButton } from "./topup-action-buttons";
import { WALLET_FEATURE_ENABLED } from "@/lib/feature-flags";

export const metadata = { title: "คำขอเติม Wallet | แดชบอร์ด" };

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pending: { label: "รอดำเนินการ", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
  approved: { label: "อนุมัติแล้ว", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  rejected: { label: "ปฏิเสธ", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
};

const METHOD_LABEL: Record<string, string> = {
  stripe: "Stripe",
  bank: "โอนธนาคาร",
};

export default async function WalletTopupPage() {
  if (!WALLET_FEATURE_ENABLED) redirect("/dashboard");

  const requests = await listAllTopupRequests();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">คำขอเติม Wallet</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          อนุมัติหรือปฏิเสธคำขอเติมเงินจากลูกค้า (โอนธนาคาร)
        </p>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">#</th>
                <th className="px-4 py-3 text-left font-medium">ลูกค้า</th>
                <th className="px-4 py-3 text-left font-medium">จำนวน</th>
                <th className="px-4 py-3 text-left font-medium">วิธี</th>
                <th className="px-4 py-3 text-left font-medium">สถานะ</th>
                <th className="px-4 py-3 text-left font-medium">สลิป</th>
                <th className="px-4 py-3 text-left font-medium">วันที่</th>
                <th className="px-4 py-3 text-left font-medium">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    ยังไม่มีคำขอ
                  </td>
                </tr>
              ) : (
                requests.map((r) => {
                  const st = STATUS_LABEL[r.status] ?? STATUS_LABEL.pending;
                  return (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-mono text-xs">{r.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{r.customerName ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{r.customerEmail}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        ฿{r.amount.toLocaleString("th-TH")}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {METHOD_LABEL[r.method] ?? r.method}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${st.className}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.slipImageUrl ? (
                          <a
                            href={`/api/r2-url?key=${encodeURIComponent(r.slipImageUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline text-xs"
                          >
                            ดูสลิป
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                        {r.createdAt
                          ? new Date(r.createdAt).toLocaleDateString("th-TH", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {r.status === "pending" ? (
                          <div className="flex gap-2">
                            <TopupApproveButton topupId={r.id} />
                            <TopupRejectButton topupId={r.id} />
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">{r.adminNote || "—"}</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
