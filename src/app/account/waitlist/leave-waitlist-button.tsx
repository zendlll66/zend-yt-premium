"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { leaveWaitlistAction } from "@/features/waitlist/waitlist.actions";

export function LeaveWaitlistButton({ productId }: { productId: number }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => { await leaveWaitlistAction(productId); })
      }
    >
      {isPending ? "กำลังยกเลิก…" : "ยกเลิก"}
    </Button>
  );
}
