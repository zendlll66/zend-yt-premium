import Link from "next/link";
import {
  deleteCustomerAccountAction,
  updateCustomerAccountAction,
} from "@/features/youtube/youtube-stock.actions";
import { findCustomerAccounts } from "@/features/youtube/youtube-stock.repo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSubmitButton } from "@/components/ui/form-submit-button";

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
                <th className="px-3 py-2">Password</th>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Notes</th>
                <th className="px-3 py-2 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {customerAccounts.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <Input name="email" form={`edit-customer-account-${row.id}`} defaultValue={row.email} className="h-8" />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      name="password"
                      form={`edit-customer-account-${row.id}`}
                      defaultValue={row.password}
                      className="h-8"
                    />
                  </td>
                  <td className="px-3 py-2">{row.orderId}</td>
                  <td className="px-3 py-2">
                    <form
                      id={`edit-customer-account-${row.id}`}
                      action={updateCustomerAccountAction}
                      className="flex items-center gap-2"
                    >
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
                      <FormSubmitButton size="sm" variant="outline" loadingText="กำลังบันทึก…">
                        บันทึก
                      </FormSubmitButton>
                    </form>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{row.notes ?? "-"}</td>
                  <td className="px-3 py-2 text-right">
                    <form action={deleteCustomerAccountAction}>
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

