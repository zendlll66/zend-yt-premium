import Link from "next/link";
import { createFamilyGroupAction } from "@/features/youtube/youtube-stock.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { PasswordInput } from "@/components/ui/password-input";

export default function AddFamilyGroupPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/stocks/family-groups">← Family Groups</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">เพิ่ม Family Group</h1>
      <form
        action={createFamilyGroupAction}
        className="flex max-w-md flex-col gap-4 rounded-xl border bg-card p-6"
      >
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
            ชื่อกลุ่ม *
          </label>
          <Input id="name" name="name" placeholder="ชื่อกลุ่ม family" required />
        </div>
        <div>
          <label htmlFor="limit" className="mb-1.5 block text-sm font-medium">
            จำนวนสมาชิกในกลุ่ม (limit) *
          </label>
          <Input
            id="limit"
            name="limit"
            type="number"
            min={1}
            defaultValue={6}
            required
          />
        </div>
        <div>
          <label htmlFor="head_email" className="mb-1.5 block text-sm font-medium">
            Head account email
          </label>
          <Input
            id="head_email"
            name="head_email"
            placeholder="อีเมลเจ้าของ family (ไม่บังคับ)"
          />
        </div>
        <PasswordInput
          id="head_password"
          name="head_password"
          label="Head account password"
          placeholder="รหัสผ่าน head account (ไม่บังคับ)"
        />
        <div>
          <label htmlFor="notes" className="mb-1.5 block text-sm font-medium">
            หมายเหตุ
          </label>
          <Input
            id="notes"
            name="notes"
            placeholder="รายละเอียด/หมายเหตุเพิ่มเติม (ไม่บังคับ)"
          />
        </div>
        <div className="flex gap-2">
          <FormSubmitButton loadingText="กำลังเพิ่ม…">เพิ่ม family group</FormSubmitButton>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/stocks/family-groups">ยกเลิก</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}

