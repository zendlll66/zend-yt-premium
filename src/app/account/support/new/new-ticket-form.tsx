"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTicketAction } from "@/features/support/support-ticket.actions";
import { Loader2 } from "lucide-react";

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  customerEmail?: string | null;
  packageTitle?: string | null;
}

export function NewTicketForm({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createTicketAction, {});

  useEffect(() => {
    if (state.ticketId) {
      router.push(`/account/support/${state.ticketId}`);
    }
  }, [state.ticketId, router]);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* เลือก Order */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Package / Order ที่มีปัญหา
          <span className="ml-1 text-muted-foreground font-normal">(ไม่บังคับ)</span>
        </label>
        <select
          name="orderId"
          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">— ไม่ระบุ Order —</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              #{o.orderNumber} ({o.status})
              {o.customerEmail ? ` · ${o.customerEmail}` : ""}
              {o.packageTitle ? ` · ${o.packageTitle}` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* หัวข้อ */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          หัวข้อปัญหา <span className="text-destructive">*</span>
        </label>
        <Input
          name="subject"
          placeholder="เช่น เข้าใช้งานไม่ได้, รหัสไม่ถูกต้อง..."
          maxLength={200}
          required
        />
      </div>

      {/* รายละเอียด */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          รายละเอียดปัญหา <span className="text-destructive">*</span>
        </label>
        <textarea
          name="description"
          placeholder="อธิบายปัญหาที่พบให้ละเอียด เช่น เกิดขึ้นเมื่อไหร่ ทำอะไรแล้วเจอปัญหา ข้อความแจ้งเตือนที่เห็น..."
          rows={5}
          required
          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        ส่งเรื่องแจ้งปัญหา
      </Button>
    </form>
  );
}
