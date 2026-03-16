import Link from "next/link";
import { deleteAccountStockAction } from "@/features/youtube/youtube-stock.actions";
import { findAccountStocks } from "@/features/youtube/youtube-stock.repo";
import { Button } from "@/components/ui/button";

function formatDate(d: Date | null) {
  if (!d) return "-";
  return new Date(d).toLocaleString("th-TH");
}

export default async function AccountStockPage() {
  const accounts = await findAccountStocks(300);
  const availableCount = accounts.filter((a) => a.status === "available").length;
  const reservedCount = accounts.filter((a) => a.status === "reserved").length;
  const soldCount = accounts.filter((a) => a.status === "sold").length;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/stocks">← Manage Stock</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">Individual Account Stock</h1>
      <div className="flex flex-wrap items-center gap-2">
        <div className="grid gap-2 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-3 text-sm">คงเหลือในคลัง: <b>{availableCount}</b></div>
          <div className="rounded-lg border bg-card p-3 text-sm">กำลังจอง: <b>{reservedCount}</b></div>
          <div className="rounded-lg border bg-card p-3 text-sm">ส่งให้ลูกค้าแล้ว: <b>{soldCount}</b></div>
        </div>
        <Button asChild>
          <Link href="/dashboard/stocks/account-stock/add">เพิ่ม stock</Link>
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
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">ลูกค้าที่ใช้</th>
                <th className="px-3 py-2">Sold At</th>
                <th className="px-3 py-2 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <Link
                      href={`/dashboard/stocks/account-stock/${row.id}/edit`}
                      className="font-medium text-primary hover:underline"
                    >
                      {row.email}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{row.status}</td>
                  <td className="px-3 py-2">{row.orderId ?? "-"}</td>
                  <td className="px-3 py-2">
                    {row.customerId ? (
                      <Link
                        href={`/dashboard/customers/${row.customerId}`}
                        className="inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs hover:bg-muted"
                      >
                        {row.customerLinePictureUrl ? (
                          <img
                            src={row.customerLinePictureUrl.startsWith("http") ? row.customerLinePictureUrl : `/api/r2-url?key=${encodeURIComponent(row.customerLinePictureUrl)}`}
                            alt=""
                            className="h-5 w-5 rounded-full object-cover"
                          />
                        ) : (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px]">U</span>
                        )}
                        <span className="max-w-[160px] truncate">{row.customerLineDisplayName ?? row.customerName ?? row.customerEmail}</span>
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
                  <td className="px-3 py-2 text-muted-foreground">{formatDate(row.soldAt ?? null)}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/stocks/account-stock/${row.id}/edit`}>แก้ไข</Link>
                      </Button>
                      <form action={deleteAccountStockAction} className="inline">
                        <input type="hidden" name="id" value={row.id} />
                        <Button
                          size="sm"
                          variant="outline"
                          type="submit"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          ลบ
                        </Button>
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

