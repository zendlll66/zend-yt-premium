import Link from "next/link";
import { notFound } from "next/navigation";
import { findAllCustomers } from "@/features/customer/customer.repo";
import { findCustomerAccountById } from "@/features/youtube/youtube-stock.repo";
import { updateCustomerAccountAction } from "@/features/youtube/youtube-stock.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { CustomerSelectField } from "@/app/dashboard/stocks/account-stock/[id]/edit/customer-select-field";
import { PasswordInput } from "@/components/ui/password-input";

export default async function EditCustomerAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const accountId = parseInt(id, 10);
  if (!Number.isFinite(accountId)) notFound();

  const [account, customers] = await Promise.all([
    findCustomerAccountById(accountId),
    findAllCustomers(500),
  ]);
  if (!account) notFound();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/stocks/customer-accounts">← Customer Accounts</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">แก้ไข Customer Account #{account.id}</h1>
      <form
        action={updateCustomerAccountAction}
        className="flex max-w-md flex-col gap-4 rounded-xl border bg-card p-6"
      >
        <input type="hidden" name="id" value={account.id} />
        <CustomerSelectField
          customers={customers}
          initialCustomerId={account.customerId}
        />
        <div>
          <label htmlFor="orderId" className="mb-1.5 block text-sm font-medium">
            Order ID *
          </label>
          <Input
            id="orderId"
            name="orderId"
            type="number"
            min={1}
            step={1}
            required
            defaultValue={account.orderId}
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            Email / Username *
          </label>
          <Input
            id="email"
            name="email"
            defaultValue={account.email}
            placeholder="อีเมลหรือ username"
            required
            className="w-full"
          />
        </div>
        <div>
          <PasswordInput
            id="password"
            name="password"
            label="Password *"
            defaultValue={account.password}
            placeholder="รหัสผ่าน"
            required
          />
        </div>
        <div>
          <label htmlFor="status" className="mb-1.5 block text-sm font-medium">
            สถานะ
          </label>
          <select
            id="status"
            name="status"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            defaultValue={account.status}
          >
            <option value="pending">pending</option>
            <option value="processing">processing</option>
            <option value="done">done</option>
          </select>
        </div>
        <div>
          <label htmlFor="notes" className="mb-1.5 block text-sm font-medium">
            หมายเหตุ
          </label>
          <Input
            id="notes"
            name="notes"
            defaultValue={account.notes ?? ""}
            placeholder="หมายเหตุ"
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <FormSubmitButton loadingText="กำลังบันทึก…">บันทึก</FormSubmitButton>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/stocks/customer-accounts">ยกเลิก</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
