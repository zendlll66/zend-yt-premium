"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changePasswordAction, setPasswordAction } from "@/features/customer/customer.actions";

type Props = { isSetPassword?: boolean };

export function ChangePasswordForm({ isSetPassword }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const form = e.currentTarget;
    const current = (form.elements.namedItem("currentPassword") as HTMLInputElement | null)?.value;
    const newPass = (form.elements.namedItem("newPassword") as HTMLInputElement).value;

    setLoading(true);
    const result = isSetPassword
      ? await setPasswordAction(newPass)
      : await changePasswordAction(current ?? "", newPass);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!isSetPassword && (
        <div>
          <label htmlFor="currentPassword" className="mb-1.5 block text-sm font-medium">
            รหัสผ่านปัจจุบัน
          </label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            disabled={loading}
          />
        </div>
      )}
      <div>
        <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium">
          {isSetPassword ? "รหัสผ่าน (อย่างน้อย 6 ตัว)" : "รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)"}
        </label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          disabled={loading}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-600 dark:text-green-400" role="status">
          {isSetPassword ? "ตั้งรหัสผ่านเรียบร้อยแล้ว" : "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว"}
        </p>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? "กำลังบันทึก…" : isSetPassword ? "ตั้งรหัสผ่าน" : "เปลี่ยนรหัสผ่าน"}
      </Button>
    </form>
  );
}
