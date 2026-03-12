"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfileAction } from "@/features/customer/customer.actions";

type Props = {
  defaultValues: { name: string; email: string; phone: string };
  isLineUser?: boolean;
  isPlaceholderEmail?: boolean;
};

export function ProfileForm({ defaultValues, isPlaceholderEmail }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <form
      action={async (formData: FormData) => {
        setError(null);
        setLoading(true);
        const result = await updateProfileAction(formData);
        setLoading(false);
        if (result.error) setError(result.error);
        else router.refresh();
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
          ชื่อ-นามสกุล *
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          defaultValue={defaultValues.name}
          required
          disabled={loading}
        />
      </div>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
          {isPlaceholderEmail ? "เพิ่มอีเมล (ไม่บังคับ)" : "อีเมล *"}
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={isPlaceholderEmail ? "" : defaultValues.email}
          placeholder={isPlaceholderEmail ? "example@email.com" : undefined}
          required={!isPlaceholderEmail}
          disabled={loading}
        />
      </div>
      <div>
        <label htmlFor="phone" className="mb-1.5 block text-sm font-medium">
          เบอร์โทร
        </label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={defaultValues.phone}
          placeholder="08x-xxx-xxxx"
          disabled={loading}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? "กำลังบันทึก…" : "บันทึก"}
      </Button>
    </form>
  );
}
