"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { updateTicketStatusAction } from "@/features/support/support-ticket.actions";
import { TICKET_STATUS_LABELS, TICKET_STATUSES, type TicketStatus } from "@/db/schema/support-ticket.schema";
import { CheckCircle2, Loader2 } from "lucide-react";

export function UpdateStatusForm({
  ticketId,
  currentStatus,
  currentNote,
}: {
  ticketId: number;
  currentStatus: TicketStatus;
  currentNote?: string | null;
}) {
  const [state, formAction, isPending] = useActionState(updateTicketStatusAction, { success: false });

  if (state.success) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        อัปเดตสถานะเรียบร้อย
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="ticketId" value={ticketId} />

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium">สถานะ</label>
        <select
          name="status"
          defaultValue={currentStatus}
          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {TICKET_STATUSES.map((s) => (
            <option key={s} value={s}>
              {TICKET_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          หมายเหตุ / ข้อความถึงลูกค้า
          <span className="ml-1 text-xs text-muted-foreground font-normal">(จะส่งทาง LINE)</span>
        </label>
        <textarea
          name="adminNote"
          defaultValue={currentNote ?? ""}
          placeholder="อธิบายสิ่งที่ดำเนินการหรือขั้นตอนต่อไป..."
          rows={3}
          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        บันทึกสถานะ
      </Button>
    </form>
  );
}
