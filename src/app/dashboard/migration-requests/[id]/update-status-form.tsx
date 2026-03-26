"use client";

import { useActionState } from "react";
import { updateMigrationStatusAction } from "@/features/migration-request/migration-request.actions";
import type { MigrationStatus } from "@/db/schema/migration-request.schema";

export function UpdateStatusForm({
  requestId,
  currentStatus,
  currentAdminNote,
}: {
  requestId: number;
  currentStatus: MigrationStatus;
  currentAdminNote: string;
}) {
  const [state, action, pending] = useActionState(updateMigrationStatusAction, {});

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        อัปเดตสถานะ
      </h2>
      <form action={action} className="space-y-4">
        <input type="hidden" name="id" value={requestId} />

        <div className="space-y-1.5">
          <label className="text-sm font-medium">สถานะ</label>
          <select
            name="status"
            defaultValue={currentStatus}
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="pending">รอตรวจสอบ</option>
            <option value="reviewing">กำลังดำเนินการ</option>
            <option value="done">เสร็จสิ้น</option>
            <option value="rejected">ปฏิเสธ</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">หมายเหตุ Admin</label>
          <textarea
            name="adminNote"
            defaultValue={currentAdminNote}
            rows={3}
            placeholder="บันทึกสำหรับ admin หรือข้อความแจ้งลูกค้า..."
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        </div>

        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        {state.success && (
          <p className="text-sm text-green-600">อัปเดตสถานะสำเร็จ</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition"
        >
          {pending ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </form>
    </div>
  );
}
