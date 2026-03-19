import Link from "next/link";
import { notFound } from "next/navigation";
import { findAllCustomers } from "@/features/customer/customer.repo";
import { findCustomerAccountById } from "@/features/youtube/youtube-stock.repo";
import { updateCustomerAccountAction } from "@/features/youtube/youtube-stock.actions";
import { findCustomerInventoryForOrderItem } from "@/features/inventory/customer-inventory.repo";
import { updateInventoryDatesAction } from "@/features/inventory/inventory-order.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { CustomerSelectField } from "@/app/dashboard/stocks/account-stock/[id]/edit/customer-select-field";
import { PasswordInput } from "@/components/ui/password-input";

function toDatetimeLocal(d: Date | null) {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

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

  let inventoryRow = null;
  if (account.orderId != null) {
    inventoryRow = await findCustomerInventoryForOrderItem({
      orderId: account.orderId,
      itemType: "customer_account",
      loginEmail: account.email,
    });
    if (!inventoryRow) {
      inventoryRow = await findCustomerInventoryForOrderItem({
        orderId: account.orderId,
        itemType: "customer_account",
      });
    }
  }

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

      {account.orderId != null && inventoryRow && (
        <form
          action={updateInventoryDatesAction}
          className="flex max-w-xl flex-col gap-4 rounded-xl border bg-card p-6"
        >
          <input type="hidden" name="id" value={inventoryRow.id} />
          <input
            type="hidden"
            name="redirectTo"
            value={`/dashboard/stocks/customer-accounts/${account.id}/edit`}
          />

          <h2 className="text-sm font-semibold">แก้ไขวันเริ่ม/หมดอายุ (Inventory)</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="activatedAt" className="mb-1.5 block text-sm font-medium">
                วันที่เริ่ม (activatedAt)
              </label>
              <Input
                id="activatedAt"
                name="activatedAt"
                type="datetime-local"
                defaultValue={toDatetimeLocal(inventoryRow.activatedAt ?? null)}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="expiresAt" className="mb-1.5 block text-sm font-medium">
                วันที่หมดอายุ (expiresAt) — แก้เลื่อนต่ออายุได้
              </label>
              <Input
                id="expiresAt"
                name="expiresAt"
                type="datetime-local"
                defaultValue={toDatetimeLocal(inventoryRow.expiresAt ?? null)}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label htmlFor="note" className="mb-1.5 block text-sm font-medium">
              หมายเหตุ
            </label>
            <Input
              id="note"
              name="note"
              defaultValue={inventoryRow.note ?? ""}
              className="w-full"
            />
          </div>

          <div className="flex gap-2">
            <FormSubmitButton loadingText="กำลังบันทึก…">บันทึกวันเริ่ม/หมดอายุ</FormSubmitButton>
          </div>
        </form>
      )}
    </div>
  );
}
