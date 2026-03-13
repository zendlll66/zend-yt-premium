import Link from "next/link";
import {
  deleteCustomerAccountAction,
  updateCustomerAccountStatusAction,
} from "@/features/youtube/youtube-stock.actions";
import { findCustomerAccounts } from "@/features/youtube/youtube-stock.repo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function CustomerAccountsPage() {
  const customerAccounts = await findCustomerAccounts(500);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/stocks">← Manage Stock</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">Customer Accounts</h1>
      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Notes</th>
                <th className="px-3 py-2 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {customerAccounts.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-3 py-2">{row.email}</td>
                  <td className="px-3 py-2">{row.orderId}</td>
                  <td className="px-3 py-2">
                    <form action={updateCustomerAccountStatusAction} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={row.id} />
                      <select
                        name="status"
                        defaultValue={row.status}
                        className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
                      >
                        <option value="pending">pending</option>
                        <option value="processing">processing</option>
                        <option value="done">done</option>
                      </select>
                      <Input
                        name="notes"
                        defaultValue={row.notes ?? ""}
                        placeholder="หมายเหตุ"
                        className="h-8"
                      />
                      <Button size="sm" variant="outline" type="submit">
                        บันทึก
                      </Button>
                    </form>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{row.notes ?? "-"}</td>
                  <td className="px-3 py-2 text-right">
                    <form action={deleteCustomerAccountAction}>
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

