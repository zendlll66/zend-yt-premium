import Link from "next/link";
import { notFound } from "next/navigation";
import { findAllCustomers } from "@/features/customer/customer.repo";
import { findAccountStockById } from "@/features/youtube/youtube-stock.repo";
import { updateAccountStockAction } from "@/features/youtube/youtube-stock.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { CustomerSelectField } from "./customer-select-field";

function toDatetimeLocal(d: Date | null): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

export default async function EditAccountStockPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const stockId = parseInt(id, 10);
  if (!Number.isFinite(stockId)) notFound();

  const [stock, customers] = await Promise.all([
    findAccountStockById(stockId),
    findAllCustomers(500),
  ]);
  if (!stock) notFound();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/stocks/account-stock">← Individual Account Stock</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">แก้ไข Account Stock #{stock.id}</h1>
      <form
        action={updateAccountStockAction}
        className="flex max-w-md flex-col gap-4 rounded-xl border bg-card p-6"
      >
        <input type="hidden" name="id" value={stock.id} />
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            Email / Username *
          </label>
          <Input
            id="email"
            name="email"
            defaultValue={stock.email}
            placeholder="email หรือ username สำหรับล็อกอิน"
            required
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
            Password *
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            defaultValue={stock.password}
            placeholder="รหัสผ่าน"
            required
            className="w-full"
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
            defaultValue={stock.status}
          >
            <option value="available">available</option>
            <option value="reserved">reserved</option>
            <option value="sold">sold</option>
          </select>
        </div>
        <div>
          <label htmlFor="orderId" className="mb-1.5 block text-sm font-medium">
            Order ID
          </label>
          <Input
            id="orderId"
            name="orderId"
            type="number"
            min={1}
            step={1}
            placeholder="ว่างไว้ถ้าไม่มี"
            defaultValue={stock.orderId ?? ""}
            className="w-full"
          />
        </div>
        <CustomerSelectField
          customers={customers}
          initialCustomerId={stock.customerId ?? null}
        />
        <div>
          <label htmlFor="reservedAt" className="mb-1.5 block text-sm font-medium">
            เวลาจอง (reservedAt)
          </label>
          <Input
            id="reservedAt"
            name="reservedAt"
            type="datetime-local"
            defaultValue={toDatetimeLocal(stock.reservedAt)}
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="soldAt" className="mb-1.5 block text-sm font-medium">
            เวลาขายแล้ว (soldAt)
          </label>
          <Input
            id="soldAt"
            name="soldAt"
            type="datetime-local"
            defaultValue={toDatetimeLocal(stock.soldAt)}
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="createdAt" className="mb-1.5 block text-sm font-medium">
            สร้างเมื่อ (createdAt)
          </label>
          <Input
            id="createdAt"
            name="createdAt"
            type="datetime-local"
            defaultValue={toDatetimeLocal(stock.createdAt)}
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="updatedAt" className="mb-1.5 block text-sm font-medium">
            แก้ไขล่าสุด (updatedAt)
          </label>
          <Input
            id="updatedAt"
            name="updatedAt"
            type="datetime-local"
            defaultValue={toDatetimeLocal(stock.updatedAt)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <FormSubmitButton loadingText="กำลังบันทึก…">บันทึก</FormSubmitButton>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/stocks/account-stock">ยกเลิก</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
