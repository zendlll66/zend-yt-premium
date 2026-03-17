import Link from "next/link";
import { notFound } from "next/navigation";
import { findAllCustomers } from "@/features/customer/customer.repo";
import { findInviteLinkById } from "@/features/youtube/youtube-stock.repo";
import { updateInviteLinkAction } from "@/features/youtube/youtube-stock.actions";
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
        <div>
          <label htmlFor="reservedAt" className="mb-1.5 block text-sm font-medium">
            เวลาจอง (reservedAt)
          </label>
          <Input
            id="reservedAt"
            name="reservedAt"
            type="datetime-local"
            defaultValue={toDatetimeLocal(linkRow.reservedAt)}
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="usedAt" className="mb-1.5 block text-sm font-medium">
            ใช้แล้ว (usedAt)
          </label>
          <Input
            id="usedAt"
            name="usedAt"
            type="datetime-local"
            defaultValue={toDatetimeLocal(linkRow.usedAt)}
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
            defaultValue={toDatetimeLocal(linkRow.createdAt)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <FormSubmitButton loadingText="กำลังบันทึก…">บันทึก</FormSubmitButton>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/stocks/invite-links">ยกเลิก</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
