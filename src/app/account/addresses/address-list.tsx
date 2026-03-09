"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { AddressItem } from "@/features/customer-address/customer-address.repo";
import {
  deleteAddressAction,
  setDefaultAddressAction,
} from "@/features/customer-address/customer-address.actions";
import { AddressEditForm } from "./address-edit-form";

export function AddressList({ addresses }: { addresses: AddressItem[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<number | null>(null);

  async function handleDelete(id: number) {
    if (!confirm("ต้องการลบที่อยู่นี้ใช่หรือไม่?")) return;
    const result = await deleteAddressAction(id);
    if (result.error) alert(result.error);
    router.refresh();
  }

  async function handleSetDefault(id: number) {
    const result = await setDefaultAddressAction(id);
    if (result.error) alert(result.error);
    router.refresh();
  }

  if (addresses.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        ยังไม่มีที่อยู่จัดส่ง เพิ่มด้านบนได้เลย
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {addresses.map((addr) => (
        <li
          key={addr.id}
          className="rounded-xl border border-border/50 bg-muted/20 p-4"
        >
          {editingId === addr.id ? (
            <AddressEditForm
              address={addr}
              onCancel={() => setEditingId(null)}
              onSuccess={() => {
                setEditingId(null);
                router.refresh();
              }}
            />
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-medium">{addr.label}</span>
                  {addr.isDefault && (
                    <span className="ml-2 rounded bg-primary/20 px-1.5 py-0.5 text-xs font-medium text-primary">
                      หลัก
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingId(addr.id)}
                  >
                    แก้ไข
                  </Button>
                  {!addr.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(addr.id)}
                    >
                      ตั้งเป็นหลัก
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(addr.id)}
                  >
                    ลบ
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {addr.recipientName} · {addr.phone}
              </p>
              <p className="mt-1 text-sm">
                {addr.addressLine1}
                {addr.addressLine2 ? ` ${addr.addressLine2}` : ""} {addr.district}{" "}
                {addr.province} {addr.postalCode}
              </p>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
