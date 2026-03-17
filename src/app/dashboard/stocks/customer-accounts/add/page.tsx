import Link from "next/link";
import { findAllCustomers } from "@/features/customer/customer.repo";
import { createCustomerAccountAction } from "@/features/youtube/youtube-stock.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { PasswordInput } from "@/components/ui/password-input";
import { CustomerSelectField } from "@/app/dashboard/stocks/account-stock/[id]/edit/customer-select-field";

export default async function AddCustomerAccountPage() {
  const customers = await findAllCustomers(500);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/stocks/customer-accounts">← Customer Accounts</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">เพิ่ม Customer Account</h1>
      <form
        action={createCustomerAccountAction}
        className="flex max-w-md flex-col gap-4 rounded-xl border bg-card p-6"
      >
        <CustomerSelectField customers={customers} initialCustomerId={null} />
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
            placeholder="เลขที่ออเดอร์"
            required
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
            placeholder="อีเมลหรือ username ที่ลูกค้าส่งมา"
            required
            className="w-full"
          />
        </div>
        <PasswordInput
          id="password"
          name="password"
          label="Password *"
          placeholder="รหัสผ่านที่ลูกค้าส่งมา"
          required
        />
        <div>
          <label htmlFor="status" className="mb-1.5 block text-sm font-medium">
            สถานะ
          </label>
          <select
            id="status"
            name="status"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            defaultValue="pending"
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
            placeholder="หมายเหตุ (ถ้ามี)"
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <FormSubmitButton loadingText="กำลังเพิ่ม…">เพิ่ม customer account</FormSubmitButton>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/stocks/customer-accounts">ยกเลิก</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
