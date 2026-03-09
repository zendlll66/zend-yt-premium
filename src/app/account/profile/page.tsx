import Link from "next/link";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { ProfileForm } from "./profile-form";
import { ChangePasswordForm } from "./change-password-form";
import { Button } from "@/components/ui/button";

export default async function ProfilePage() {
  const customer = await getCustomerSession();
  if (!customer) return null;

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/account">← บัญชี</Link>
        </Button>
        <h1 className="mt-2 text-xl font-semibold">แก้ไขโปรไฟล์</h1>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 font-medium">ข้อมูลส่วนตัว</h2>
        <ProfileForm
          defaultValues={{
            name: customer.name,
            email: customer.email,
            phone: customer.phone ?? "",
          }}
        />
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 font-medium">เปลี่ยนรหัสผ่าน</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
