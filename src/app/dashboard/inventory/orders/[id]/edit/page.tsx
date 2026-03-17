import Link from "next/link";
import { notFound } from "next/navigation";
import { findInventoryOrderById } from "@/features/inventory/inventory-order.repo";
import { updateInventoryOrderAction, deleteInventoryOrderAction } from "@/features/inventory/inventory-order.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { INVENTORY_ITEM_TYPES } from "@/db/schema/customer-inventory.schema";

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

export default async function EditInventoryOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inventoryId = parseInt(id, 10);
  if (!Number.isFinite(inventoryId)) notFound();

  const row = await findInventoryOrderById(inventoryId);
  if (!row) notFound();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/inventory/orders/active">← Inventory Orders</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">แก้ไข Inventory #{row.id}</h1>
      <p className="text-sm text-muted-foreground">
        Order #{row.orderNumber} · ลูกค้า: {row.customerName} ({row.customerEmail})
      </p>

      <div className="flex max-w-xl flex-col gap-6">
        <form
          action={updateInventoryOrderAction}
          className="flex flex-col gap-4 rounded-xl border bg-card p-6"
        >
          <input type="hidden" name="id" value={row.id} />
          <div>
            <label htmlFor="itemType" className="mb-1.5 block text-sm font-medium">
              ประเภท (itemType) *
            </label>
            <select
              id="itemType"
              name="itemType"
              required
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue={row.itemType}
            >
              {INVENTORY_ITEM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-medium">
              Title *
            </label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={row.title}
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="loginEmail" className="mb-1.5 block text-sm font-medium">
              Login Email / Username
            </label>
            <Input
              id="loginEmail"
              name="loginEmail"
              defaultValue={row.loginEmail ?? ""}
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="loginPassword" className="mb-1.5 block text-sm font-medium">
              Login Password
            </label>
            <Input
              id="loginPassword"
              name="loginPassword"
              type="password"
              autoComplete="new-password"
              defaultValue={row.loginPassword ?? ""}
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="inviteLink" className="mb-1.5 block text-sm font-medium">
              Invite Link
            </label>
            <Input
              id="inviteLink"
              name="inviteLink"
              defaultValue={row.inviteLink ?? ""}
              className="w-full"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="durationDays" className="mb-1.5 block text-sm font-medium">
                ระยะเวลา (วัน) *
              </label>
              <Input
                id="durationDays"
                name="durationDays"
                type="number"
                min={1}
                defaultValue={row.durationDays}
                className="w-full"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="activatedAt" className="mb-1.5 block text-sm font-medium">
                วันที่เริ่ม (activatedAt)
              </label>
              <Input
                id="activatedAt"
                name="activatedAt"
                type="datetime-local"
                defaultValue={toDatetimeLocal(row.activatedAt)}
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
                defaultValue={toDatetimeLocal(row.expiresAt)}
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
              defaultValue={row.note ?? ""}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <FormSubmitButton loadingText="กำลังบันทึก…">บันทึก</FormSubmitButton>
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/inventory/orders/active">ยกเลิก</Link>
            </Button>
          </div>
        </form>

        <form
          action={deleteInventoryOrderAction}
          className="rounded-xl border border-destructive/50 bg-card p-6"
        >
          <input type="hidden" name="id" value={row.id} />
          <p className="mb-3 text-sm text-muted-foreground">
            ลบรายการ inventory นี้ (คำสั่งซื้อ #{row.orderNumber} จะยังอยู่)
          </p>
          <FormSubmitButton
            variant="destructive"
            loadingText="กำลังลบ…"
          >
            ลบรายการนี้
          </FormSubmitButton>
        </form>
      </div>
    </div>
  );
}
