import Link from "next/link";
import { notFound } from "next/navigation";
import { findAllCustomers } from "@/features/customer/customer.repo";
import { findFamilyMemberById } from "@/features/youtube/youtube-stock.repo";
import { updateFamilyMemberAction } from "@/features/youtube/youtube-stock.actions";
import { findCustomerInventoryForOrderItem } from "@/features/inventory/customer-inventory.repo";
import { updateInventoryDatesByOrderAction } from "@/features/inventory/inventory-order.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { PasswordInput } from "@/components/ui/password-input";
import { CustomerSelectField } from "@/app/dashboard/stocks/account-stock/[id]/edit/customer-select-field";

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

export default async function EditFamilyMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const memberId = parseInt(id, 10);
  if (!Number.isFinite(memberId)) notFound();

  const [member, customers] = await Promise.all([
    findFamilyMemberById(memberId),
    findAllCustomers(500),
  ]);
  if (!member) notFound();

  const inventoryRow = member.orderId
    ? await findCustomerInventoryForOrderItem({
        orderId: member.orderId,
        itemType: "family",
        loginEmail: member.email,
      }).then((r) => r ?? null)
    : null;

  const inventoryRowWithFallback =
    inventoryRow ?? (member.orderId ? await findCustomerInventoryForOrderItem({ orderId: member.orderId, itemType: "family" }) : null);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/stocks/family-groups/${member.familyGroupId}/edit`}>
            ← Family Group #{member.familyGroupId}
          </Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">แก้ไขสมาชิก Family #{member.id}</h1>

      <form
        action={updateFamilyMemberAction}
        className="flex max-w-md flex-col gap-4 rounded-xl border bg-card p-6"
      >
        <input type="hidden" name="id" value={member.id} />
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            Email *
          </label>
          <Input
            id="email"
            name="email"
            defaultValue={member.email}
            placeholder="อีเมลสมาชิก"
            required
          />
        </div>
        <PasswordInput
          id="member_password"
          name="member_password"
          label="Password"
          defaultValue={member.memberPassword ?? ""}
          placeholder="รหัสผ่านสมาชิก (ว่างได้ถ้าใช้แค่ลิงก์เชิญ)"
        />
        <div>
          <label htmlFor="invite_link" className="mb-1.5 block text-sm font-medium">
            ลิงก์เชิญ
          </label>
          <Input
            id="invite_link"
            name="invite_link"
            defaultValue={member.inviteLink ?? ""}
            placeholder="ว่างได้ — ใส่เมื่อช่องนี้เป็นลิงก์เชิญ"
          />
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
            defaultValue={member.orderId ?? ""}
            placeholder="ว่างไว้ถ้าไม่มี"
          />
        </div>
        <CustomerSelectField
          customers={customers}
          initialCustomerId={member.customerId ?? null}
        />
        <div className="flex gap-2">
          <FormSubmitButton loadingText="กำลังบันทึก…">บันทึก</FormSubmitButton>
          <Button type="button" variant="outline" asChild>
            <Link href={`/dashboard/stocks/family-groups/${member.familyGroupId}/edit`}>
              ยกเลิก
            </Link>
          </Button>
        </div>
      </form>

      {member.orderId != null && (
        <form
          action={updateInventoryDatesByOrderAction}
          className="flex max-w-xl flex-col gap-4 rounded-xl border bg-card p-6"
        >
          <input type="hidden" name="orderId" value={member.orderId ?? ""} />
          <input type="hidden" name="itemType" value="family" />
          <input
            type="hidden"
            name="redirectTo"
            value={`/dashboard/stocks/family-groups/${member.familyGroupId}/edit`}
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
                defaultValue={toDatetimeLocal(inventoryRowWithFallback?.activatedAt ?? null)}
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
                defaultValue={toDatetimeLocal(inventoryRowWithFallback?.expiresAt ?? null)}
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
              defaultValue={inventoryRowWithFallback?.note ?? ""}
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

