"use client";

import { useActionState } from "react";
import { bulkNotifyAction, type BulkNotifyState } from "./notify.actions";
import { Button } from "@/components/ui/button";
import { Bell, Users } from "lucide-react";

export default function NotifyPage() {
  const [state, formAction, pending] = useActionState(bulkNotifyAction, { success: false });

  return (
    <div className="max-w-xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">ส่งข้อความแจ้งเตือน</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ส่ง LINE push message ถึงลูกค้าที่เชื่อมต่อ LINE แล้ว
        </p>
      </div>

      <form action={formAction} className="space-y-5 rounded-xl border bg-card p-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium">กลุ่มเป้าหมาย</label>
          <select
            name="segment"
            defaultValue="line"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="line">ลูกค้าที่เชื่อม LINE ทั้งหมด</option>
          </select>
          <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />
            จะส่งเฉพาะลูกค้าที่มี LINE User ID เท่านั้น
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            ข้อความ <span className="text-destructive">*</span>
          </label>
          <textarea
            name="message"
            rows={5}
            required
            placeholder="พิมพ์ข้อความที่ต้องการส่ง..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {state.error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}
        {state.success && (
          <div className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
            ส่งสำเร็จ {state.sent} ราย{state.skipped ? ` (ล้มเหลว/ข้าม ${state.skipped} ราย)` : ""}
          </div>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          <Bell className="mr-2 h-4 w-4" />
          {pending ? "กำลังส่ง..." : "ส่งข้อความ"}
        </Button>
      </form>
    </div>
  );
}
