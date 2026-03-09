"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateAddressAction } from "@/features/customer-address/customer-address.actions";
import type { AddressItem } from "@/features/customer-address/customer-address.repo";

type Props = {
  address: AddressItem;
  onCancel: () => void;
  onSuccess: () => void;
};

export function AddressEditForm({ address, onCancel, onSuccess }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <form
      action={async (formData: FormData) => {
        setError(null);
        setLoading(true);
        const result = await updateAddressAction(address.id, formData);
        setLoading(false);
        if (result.error) setError(result.error);
        else onSuccess();
      }}
      className="flex flex-col gap-3"
    >
      <Input
        name="label"
        type="text"
        defaultValue={address.label}
        placeholder="ชื่อที่อยู่"
        disabled={loading}
      />
      <Input
        name="recipientName"
        type="text"
        defaultValue={address.recipientName}
        placeholder="ชื่อผู้รับ *"
        required
        disabled={loading}
      />
      <Input
        name="phone"
        type="tel"
        defaultValue={address.phone}
        placeholder="เบอร์โทร *"
        required
        disabled={loading}
      />
      <Input
        name="addressLine1"
        type="text"
        defaultValue={address.addressLine1}
        placeholder="ที่อยู่บรรทัด 1 *"
        required
        disabled={loading}
      />
      <Input
        name="addressLine2"
        type="text"
        defaultValue={address.addressLine2 ?? ""}
        placeholder="ที่อยู่บรรทัด 2"
        disabled={loading}
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          name="district"
          type="text"
          defaultValue={address.district}
          placeholder="ตำบล/แขวง *"
          required
          disabled={loading}
        />
        <Input
          name="province"
          type="text"
          defaultValue={address.province}
          placeholder="จังหวัด *"
          required
          disabled={loading}
        />
      </div>
      <Input
        name="postalCode"
        type="text"
        defaultValue={address.postalCode}
        placeholder="รหัสไปรษณีย์ *"
        required
        maxLength={5}
        disabled={loading}
      />
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`isDefault-${address.id}`}
          name="isDefault"
          value="1"
          defaultChecked={address.isDefault}
          className="h-4 w-4 rounded border-input"
          disabled={loading}
        />
        <label htmlFor={`isDefault-${address.id}`} className="text-sm">
          ใช้เป็นที่อยู่หลัก
        </label>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "กำลังบันทึก…" : "บันทึก"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          ยกเลิก
        </Button>
      </div>
    </form>
  );
}
