"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createAddressAction } from "@/features/customer-address/customer-address.actions";

export function AddAddressForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <form
      action={async (formData: FormData) => {
        setError(null);
        setLoading(true);
        const result = await createAddressAction(formData);
        setLoading(false);
        if (result.error) setError(result.error);
        else {
          router.refresh();
          const form = document.getElementById("add-address-form") as HTMLFormElement;
          form?.reset();
        }
      }}
      id="add-address-form"
      className="flex flex-col gap-4"
    >
      <div>
        <label htmlFor="label" className="mb-1.5 block text-sm font-medium">
          ชื่อที่อยู่ (เช่น บ้าน, ที่ทำงาน)
        </label>
        <Input id="label" name="label" type="text" placeholder="บ้าน" disabled={loading} />
      </div>
      <div>
        <label htmlFor="recipientName" className="mb-1.5 block text-sm font-medium">
          ชื่อผู้รับ *
        </label>
        <Input
          id="recipientName"
          name="recipientName"
          type="text"
          placeholder="ชื่อ-นามสกุล"
          required
          disabled={loading}
        />
      </div>
      <div>
        <label htmlFor="phone" className="mb-1.5 block text-sm font-medium">
          เบอร์โทร *
        </label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="08x-xxx-xxxx"
          required
          disabled={loading}
        />
      </div>
      <div>
        <label htmlFor="addressLine1" className="mb-1.5 block text-sm font-medium">
          ที่อยู่บรรทัด 1 *
        </label>
        <Input
          id="addressLine1"
          name="addressLine1"
          type="text"
          placeholder="เลขที่ ถนน ตำบล/แขวง"
          required
          disabled={loading}
        />
      </div>
      <div>
        <label htmlFor="addressLine2" className="mb-1.5 block text-sm font-medium">
          ที่อยู่บรรทัด 2 (ไม่บังคับ)
        </label>
        <Input
          id="addressLine2"
          name="addressLine2"
          type="text"
          placeholder="หมู่ที่ อาคาร ฯลฯ"
          disabled={loading}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="district" className="mb-1.5 block text-sm font-medium">
            ตำบล/แขวง *
          </label>
          <Input id="district" name="district" type="text" required disabled={loading} />
        </div>
        <div>
          <label htmlFor="province" className="mb-1.5 block text-sm font-medium">
            จังหวัด *
          </label>
          <Input id="province" name="province" type="text" required disabled={loading} />
        </div>
      </div>
      <div>
        <label htmlFor="postalCode" className="mb-1.5 block text-sm font-medium">
          รหัสไปรษณีย์ *
        </label>
        <Input
          id="postalCode"
          name="postalCode"
          type="text"
          placeholder="10110"
          required
          maxLength={5}
          disabled={loading}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isDefault"
          name="isDefault"
          value="1"
          className="h-4 w-4 rounded border-input"
          disabled={loading}
        />
        <label htmlFor="isDefault" className="text-sm">
          ใช้เป็นที่อยู่หลัก
        </label>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? "กำลังเพิ่ม…" : "เพิ่มที่อยู่"}
      </Button>
    </form>
  );
}
