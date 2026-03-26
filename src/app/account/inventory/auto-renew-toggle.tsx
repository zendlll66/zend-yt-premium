"use client";

import { useActionState } from "react";
import { toggleAutoRenewAction } from "@/features/inventory/auto-renewal.actions";
import { RefreshCw } from "lucide-react";

export function AutoRenewToggle({
  inventoryId,
  autoRenew,
}: {
  inventoryId: number;
  autoRenew: boolean;
}) {
  const [state, formAction, isPending] = useActionState(toggleAutoRenewAction, { success: false });

  return (
    <form action={formAction}>
      <input type="hidden" name="inventoryId" value={inventoryId} />
      <input type="hidden" name="autoRenew" value={autoRenew ? "0" : "1"} />
      <button
        type="submit"
        disabled={isPending}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
          autoRenew
            ? "bg-primary/10 text-primary hover:bg-primary/20"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        }`}
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
        {autoRenew ? "ต่ออายุอัตโนมัติ: เปิด" : "ต่ออายุอัตโนมัติ: ปิด"}
      </button>
      {state?.error && <p className="mt-1 text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
