import Link from "next/link";
import { notFound } from "next/navigation";
import { findAllCustomers } from "@/features/customer/customer.repo";
import { findInviteLinkById } from "@/features/youtube/youtube-stock.repo";
import { updateInviteLinkAction } from "@/features/youtube/youtube-stock.actions";
import { updateInventoryDatesAction } from "@/features/inventory/inventory-order.actions";
import { findCustomerInventoryForOrderItem } from "@/features/inventory/customer-inventory.repo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
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

export default async function EditInviteLinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const linkId = parseInt(id, 10);
  if (!Number.isFinite(linkId)) notFound();

  const [linkRow, customers] = await Promise.all([
    findInviteLinkById(linkId),
    findAllCustomers(500),
  ]);
  if (!linkRow) notFound();

  const inventoryRow =
    linkRow.orderId != null
      ? await findCustomerInventoryForOrderItem({
          orderId: linkRow.orderId,
          itemType: "invite",
          inviteLink: linkRow.link,
        })
      : null;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/stocks/invite-links">← Invite Links</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">แก้ไข Invite Link #{linkRow.id}</h1>
      <form
        action={updateInviteLinkAction}
        className="flex max-w-md flex-col gap-4 rounded-xl border bg-card p-6"
      >
        <input type="hidden" name="id" value={linkRow.id} />
        <div>
          <label htmlFor="link" className="mb-1.5 block text-sm font-medium">
            Link *
          </label>
          <Input
            id="link"
            name="link"
            defaultValue={linkRow.link}
            placeholder="https://youtube.com/invite/..."
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
            defaultValue={linkRow.status}
          >
            <option value="available">available</option>
            <option value="reserved">reserved</option>
            <option value="used">used</option>
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
            defaultValue={linkRow.orderId ?? ""}
            className="w-full"
          />
        </div>
        <CustomerSelectField
          customers={customers}
          initialCustomerId={linkRow.customerId ?? null}
        />
        <div className="flex gap-2">
          <FormSubmitButton loadingText="กำลังบันทึก…">บันทึก</FormSubmitButton>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/stocks/invite-links">ยกเลิก</Link>
          </Button>
        </div>
      </form>

      {inventoryRow && (
        <form
          action={updateInventoryDatesAction}
          className="flex max-w-xl flex-col gap-4 rounded-xl border bg-card p-6"
        >
          <input type="hidden" name="id" value={inventoryRow.id} />
          <input
            type="hidden"
            name="redirectTo"
            value={`/dashboard/stocks/invite-links/${linkRow.id}/edit`}
          />

          <h2 className="text-sm font-semibold">แก้ไขวันเริ่ม/หมดอายุ</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="activatedAt" className="mb-1.5 block text-sm font-medium">
                วันที่เริ่ม (activatedAt)
              </label>
              <Input
                id="activatedAt"
                name="activatedAt"
                type="datetime-local"
                lang="th-TH"
                defaultValue={toDatetimeLocal(inventoryRow.activatedAt)}
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
                lang="th-TH"
                defaultValue={toDatetimeLocal(inventoryRow.expiresAt)}
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
