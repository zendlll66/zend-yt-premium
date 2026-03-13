import Link from "next/link";
import {
  createAccountStockAction,
  deleteAccountStockAction,
  updateAccountStockStatusAction,
} from "@/features/youtube/youtube-stock.actions";
import { findAccountStocks } from "@/features/youtube/youtube-stock.repo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function formatDate(d: Date | null) {
  if (!d) return "-";
  return new Date(d).toLocaleString("th-TH");
}

export default async function AccountStockPage() {
  const accounts = await findAccountStocks(300);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/stocks">← Manage Stock</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">Individual Account Stock</h1>
      <form action={createAccountStockAction} className="grid gap-2 rounded-xl border bg-card p-4 md:grid-cols-4">
        <Input name="email" placeholder="email / username" required />
        <Input name="password" placeholder="password" required />
        <select
          name="status"
          className="h-9 rounded-4xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          defaultValue="available"
        >
          <option value="available">available</option>
          <option value="reserved">reserved</option>
          <option value="sold">sold</option>
        </select>
        <Button type="submit">เพิ่ม stock</Button>
      </form>
      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Sold At</th>
                <th className="px-3 py-2 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-3 py-2">{row.email}</td>
                  <td className="px-3 py-2">
                    <form action={updateAccountStockStatusAction} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={row.id} />
                      <select
                        name="status"
                        defaultValue={row.status}
                        className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
                      >
                        <option value="available">available</option>
                        <option value="reserved">reserved</option>
                        <option value="sold">sold</option>
                      </select>
                      <Button size="sm" variant="outline" type="submit">
                        บันทึก
                      </Button>
                    </form>
                  </td>
                  <td className="px-3 py-2">{row.orderId ?? "-"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{formatDate(row.soldAt ?? null)}</td>
                  <td className="px-3 py-2 text-right">
                    <form action={deleteAccountStockAction}>
                      <input type="hidden" name="id" value={row.id} />
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        ลบ
                      </Button>
                    </form>
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

