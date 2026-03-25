"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { notifyWaitlistAction } from "@/features/waitlist/waitlist.actions";

export function NotifyWaitlistButton({
  productId,
  productName,
}: {
  productId: number;
  productName: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleNotify() {
    if (!confirm(`ส่งแจ้งเตือนให้ลูกค้าใน waitlist ของ "${productName}" ทุกคน?`)) return;
    const fd = new FormData();
    fd.set("productId", String(productId));
    fd.set("productName", productName);
    startTransition(() => notifyWaitlistAction(fd).then((r) => {
      if (r && "sent" in r) alert(`ส่งแจ้งเตือนแล้ว ${r.sent} คน`);
    }));
  }

  return (
    <Button size="sm" onClick={handleNotify} disabled={isPending}>
      {isPending ? "กำลังส่ง…" : "แจ้งเตือนทั้งหมด"}
    </Button>
  );
}
