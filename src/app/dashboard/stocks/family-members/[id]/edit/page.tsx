import Link from "next/link";
import { notFound } from "next/navigation";
import { findAllCustomers } from "@/features/customer/customer.repo";
import { findFamilyMemberById } from "@/features/youtube/youtube-stock.repo";
import { updateFamilyMemberAction } from "@/features/youtube/youtube-stock.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { PasswordInput } from "@/components/ui/password-input";
import { CustomerSelectField } from "@/app/dashboard/stocks/account-stock/[id]/edit/customer-select-field";

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
          placeholder="รหัสผ่านสมาชิก"
        />
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
    </div>
  );
}

