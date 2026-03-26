"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { approveTopupAction, rejectTopupAction } from "@/features/wallet/wallet-topup.actions";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export function TopupApproveButton({ topupId }: { topupId: number }) {
  const [state, formAction, isPending] = useActionState(approveTopupAction, { success: false });

  if (state.success) {
    return <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />อนุมัติแล้ว</span>;
  }

  return (
    <form action={(fd) => { fd.set("topupId", String(topupId)); return formAction(fd); }}>
      {state.error && <p className="text-xs text-destructive mb-1">{state.error}</p>}
      <Button type="submit" size="sm" disabled={isPending} className="h-7 text-xs gap-1">
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
        อนุมัติ
      </Button>
    </form>
  );
}

export function TopupRejectButton({ topupId }: { topupId: number }) {
  const [state, formAction, isPending] = useActionState(rejectTopupAction, { success: false });

  if (state.success) {
    return <span className="text-xs text-red-600 flex items-center gap-1"><XCircle className="h-3 w-3" />ปฏิเสธแล้ว</span>;
  }

  return (
    <form action={(fd) => { fd.set("topupId", String(topupId)); return formAction(fd); }}>
      {state.error && <p className="text-xs text-destructive mb-1">{state.error}</p>}
      <Button type="submit" size="sm" variant="outline" disabled={isPending} className="h-7 text-xs gap-1">
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
        ปฏิเสธ
      </Button>
    </form>
  );
}
