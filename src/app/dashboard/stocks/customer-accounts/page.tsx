import Link from "next/link";
import {
  deleteCustomerAccountAction,
} from "@/features/youtube/youtube-stock.actions";
import { findCustomerAccounts } from "@/features/youtube/youtube-stock.repo";
import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { PasswordToggle } from "@/components/ui/password-toggle";

function formatDate(d: Date | null) {
  if (!d) return "-";
  return new Date(d).toLocaleString("th-TH");
}

function daysLeft(expiresAt: Date | null) {
  if (!expiresAt) return null;
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

function getStatusBadge(status: string) {
  const s = (status || "").toLowerCase();
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium";
  if (s === "pending") {
    return {
      label: "pending",
      className: `${base} border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300`,
    };
  }
  if (s === "processing") {
    return {
      label: "processing",
      className: `${base} border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300`,
    };
  }
  if (s === "done") {
    return {
      label: "done",
      className: `${base} border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300`,
    };
  }
  return {
    label: status,
    className: `${base} border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-300`,
  };
}

export default async function CustomerAccountsPage() {
  const rows = await findCustomerAccounts(500);
  const pendingCount = rows.filter((r) => r.status === "pending").length;
  const processingCount = rows.filter((r) => r.status === "processing").length;
  const doneCount = rows.filter((r) => r.status === "done").length;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/stocks">← Manage Stock</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">Customer Accounts</h1>
      <div className="flex flex-wrap items-center gap-2">
        <div className="grid gap-2 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-3 text-sm">
            รอจัดการ: <b>{pendingCount}</b>
          </div>
          <div className="rounded-lg border bg-card p-3 text-sm">
            กำลังดำเนินการ: <b>{processingCount}</b>
          </div>
          <div className="rounded-lg border bg-card p-3 text-sm">
            เสร็จแล้ว: <b>{doneCount}</b>
          </div>
        </div>
        <Button asChild>
          <Link href="/dashboard/stocks/customer-accounts/add">เพิ่ม customer account</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/orders/add">สร้าง order ให้ลูกค้า</Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Password</th>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">ลูกค้า</th>
                <th className="px-3 py-2">เหลือ</th>
                <th className="px-3 py-2">Notes</th>
                <th className="px-3 py-2">Updated</th>
                <th className="px-3 py-2 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <Link
                      href={`/dashboard/stocks/customer-accounts/${row.id}/edit`}
                      className="font-medium text-primary hover:underline"
                    >
                      {row.email}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <PasswordToggle value={row.password} />
                  </td>
                  <td className="px-3 py-2">{row.orderId ?? "-"}</td>
                  <td className="px-3 py-2">
                    {(() => {
                      const b = getStatusBadge(row.status);
                      return <span className={b.className}>{b.label}</span>;
                    })()}
                  </td>
                  <td className="px-3 py-2">
                    {row.customerId ? (
                      <Link
                        href={`/dashboard/customers/${row.customerId}`}
                        className="inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs hover:bg-muted"
                      >
                        {row.customerLinePictureUrl ? (
                          <img
                            src={
                              row.customerLinePictureUrl.startsWith("http")
                                ? row.customerLinePictureUrl
                                : `/api/r2-url?key=${encodeURIComponent(row.customerLinePictureUrl)}`
                            }
                            alt=""
                            className="h-5 w-5 rounded-full object-cover"
                          />
                        ) : (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px]">
                            U
                          </span>
                        )}
                        <span className="max-w-[160px] truncate">
                          {row.customerLineDisplayName ?? row.customerName ?? row.customerEmail ?? `#${row.customerId}`}
                        </span>
                        {(row.customerLineDisplayName ?? row.customerLinePictureUrl) && (
                          <span className="shrink-0 rounded bg-[#06C755]/15 px-1.5 py-0.5 text-[10px] font-medium text-[#06C755]">
                            LINE
                          </span>
                        )}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {(() => {
                      const d = daysLeft((row as { expiresAt?: Date | null }).expiresAt ?? null);
                      if (d == null) return <span className="text-muted-foreground">-</span>;
                      if (d < 0) return <span className="text-destructive font-medium">หมดอายุ</span>;
                      return (
                        <span className={d <= 3 ? "text-amber-600 font-medium" : ""}>
                          {d} วัน
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-3 py-2 max-w-[120px] truncate text-muted-foreground" title={row.notes ?? undefined}>
                    {row.notes ?? "-"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{formatDate(row.updatedAt ?? null)}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/stocks/customer-accounts/${row.id}/edit`}>แก้ไข</Link>
                      </Button>
                      <form action={deleteCustomerAccountAction} className="inline">
                        <input type="hidden" name="id" value={row.id} />
                        <FormSubmitButton
                          size="sm"
                          variant="outline"
                          loadingText="กำลังลบ…"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          ลบ
                        </FormSubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
