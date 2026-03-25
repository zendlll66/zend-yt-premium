"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminAddCreditAction } from "@/features/wallet/wallet.actions";

export function AddCreditForm({ customerId }: { customerId: number }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(adminAddCreditAction, {});

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        + เติม Wallet
      </Button>
    );
  }

  return (
    <form
      action={(fd) => {
        fd.set("customerId", String(customerId));
        return formAction(fd);
      }}
      className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-3 min-w-56"
    >
      <p className="text-sm font-medium">เติม Wallet</p>
      <Input name="amount" type="number" min="1" step="1" placeholder="จำนวนเงิน (บาท)" disabled={isPending} required />
      <Input name="description" type="text" placeholder="หมายเหตุ (เช่น โปรโมชัน)" defaultValue="Admin เติมเงิน" disabled={isPending} />
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
      {state?.success && <p className="text-xs text-green-600">เติมเงินสำเร็จ</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>{isPending ? "กำลังเติม…" : "ยืนยัน"}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>ยกเลิก</Button>
      </div>
    </form>
  );
}
