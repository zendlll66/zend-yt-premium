import Link from "next/link";
import { notFound } from "next/navigation";
import { ORDER_PRODUCT_TYPES, ORDER_STATUSES } from "@/db/schema/order.schema";
import { findOrderById } from "@/features/order/order.repo";
import { findAllCustomers } from "@/features/customer/customer.repo";
import { updateOrderAdminAction } from "@/features/order/order.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomerSelectField } from "@/app/dashboard/stocks/account-stock/[id]/edit/customer-select-field";

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

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orderId = parseInt(id, 10);
  if (!Number.isFinite(orderId)) notFound();

  const [order, customers] = await Promise.all([
    findOrderById(orderId),
    findAllCustomers(500),
  ]);
  if (!order) notFound();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/orders/${order.id}`}>← กลับหน้ารายละเอียด</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">แก้ไขคำสั่งซื้อ #{order.orderNumber}</h1>
      <p className="text-sm text-muted-foreground">
        ปรับข้อมูลลูกค้า, สถานะ, ประเภทสินค้า, ยอดเงิน และช่วงเวลาเช่า
      </p>

      <form
        action={updateOrderAdminAction}
        className="flex max-w-xl flex-col gap-4 rounded-xl border bg-card p-6"
      >
        <input type="hidden" name="id" value={order.id} />

        <CustomerSelectField
          customers={customers}
          initialCustomerId={order.customerIdResolved ?? null}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="status" className="mb-1.5 block text-sm font-medium">
              สถานะ (Status)
            </label>
            <select
              id="status"
              name="status"
              defaultValue={order.status}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="productType" className="mb-1.5 block text-sm font-medium">
              ประเภทสินค้า (Product Type)
            </label>
            <select
              id="productType"
              name="productType"
              defaultValue={order.productType}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {ORDER_PRODUCT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="totalPrice" className="mb-1.5 block text-sm font-medium">
              ยอดรวม (Total Price)
            </label>
            <Input
              id="totalPrice"
              name="totalPrice"
              type="number"
              step="0.01"
              defaultValue={order.totalPrice}
            />
          </div>
          <div>
            <label htmlFor="depositAmount" className="mb-1.5 block text-sm font-medium">
              มัดจำ (Deposit Amount)
            </label>
            <Input
              id="depositAmount"
              name="depositAmount"
              type="number"
              step="0.01"
              defaultValue={order.depositAmount}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="rentalStart" className="mb-1.5 block text-sm font-medium">
              วันที่เริ่มเช่า (Rental Start)
            </label>
            <Input
              id="rentalStart"
              name="rentalStart"
              type="datetime-local"
              defaultValue={toDatetimeLocal(order.rentalStart)}
            />
          </div>
          <div>
            <label htmlFor="rentalEnd" className="mb-1.5 block text-sm font-medium">
              วันที่คืน (Rental End)
            </label>
            <Input
              id="rentalEnd"
              name="rentalEnd"
              type="datetime-local"
              defaultValue={toDatetimeLocal(order.rentalEnd)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="customerName" className="mb-1.5 block text-sm font-medium">
            ชื่อลูกค้า
          </label>
          <Input
            id="customerName"
            name="customerName"
            defaultValue={order.customerName}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="customerEmail" className="mb-1.5 block text-sm font-medium">
              อีเมลลูกค้า
            </label>
            <Input
              id="customerEmail"
              name="customerEmail"
              type="email"
              defaultValue={order.customerEmail}
              required
            />
          </div>
          <div>
            <label htmlFor="customerPhone" className="mb-1.5 block text-sm font-medium">
              เบอร์โทรลูกค้า
            </label>
            <Input
              id="customerPhone"
              name="customerPhone"
              defaultValue={order.customerPhone ?? ""}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit">บันทึกการเปลี่ยนแปลง</Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/dashboard/orders/${order.id}`}>ยกเลิก</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}

