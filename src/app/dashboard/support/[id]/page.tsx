import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getTicketByIdAdmin } from "@/features/support/support-ticket.repo";
import { TICKET_STATUS_LABELS, type TicketStatus } from "@/db/schema/support-ticket.schema";
import { UpdateStatusForm } from "./update-status-form";

export const metadata = { title: "Ticket Detail | แดชบอร์ด" };

const STATUS_STYLE: Record<TicketStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  closed: "bg-muted text-muted-foreground",
};

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticketId = parseInt(id, 10);
  if (!ticketId) notFound();

  const ticket = await getTicketByIdAdmin(ticketId);
  if (!ticket) notFound();

  const status = ticket.status as TicketStatus;

  return (
    <div className="flex flex-1 flex-col gap-6 max-w-2xl">
      <div>
        <Link
          href="/dashboard/support"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition mb-3"
        >
          <ChevronLeft className="h-4 w-4" />
          รายการ Ticket
        </Link>
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-xl font-semibold">{ticket.subject}</h1>
          <span
            className={`shrink-0 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}
          >
            {TICKET_STATUS_LABELS[status]}
          </span>
        </div>
      </div>

      {/* ข้อมูลลูกค้า */}
      <div className="rounded-xl border bg-card p-5 space-y-2">
        <h2 className="text-sm font-semibold">ข้อมูลลูกค้า</h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <span className="text-muted-foreground">ชื่อ</span>
          <span className="font-medium">{ticket.customerName ?? "—"}</span>
          <span className="text-muted-foreground">อีเมล</span>
          <span>{ticket.customerEmail ?? "—"}</span>
          <span className="text-muted-foreground">LINE</span>
          <span className="font-mono text-xs">{ticket.lineUserId ? "✅ เชื่อมต่อแล้ว" : "—"}</span>
          {ticket.orderNumber && (
            <>
              <span className="text-muted-foreground">Order</span>
              <span className="font-mono">#{ticket.orderNumber}</span>
            </>
          )}
          {ticket.adminName && (
            <>
              <span className="text-muted-foreground">Admin ผู้รับเรื่อง</span>
              <span>{ticket.adminName}</span>
            </>
          )}
        </div>
      </div>

      {/* รายละเอียดปัญหา */}
      <div className="rounded-xl border bg-card p-5 space-y-2">
        <h2 className="text-sm font-semibold">รายละเอียดปัญหา</h2>
        <p className="text-sm whitespace-pre-wrap text-foreground/90">{ticket.description}</p>
        <p className="text-xs text-muted-foreground">
          แจ้งเมื่อ{" "}
          {new Date(ticket.createdAt).toLocaleDateString("th-TH", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {/* อัปเดตสถานะ */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="text-sm font-semibold">อัปเดตสถานะ</h2>
        <p className="text-xs text-muted-foreground">
          การเปลี่ยนสถานะจะส่ง LINE แจ้งลูกค้าโดยอัตโนมัติ (หากเชื่อม LINE ไว้)
        </p>
        <UpdateStatusForm
          ticketId={ticket.id}
          currentStatus={status}
          currentNote={ticket.adminNote}
        />
      </div>
    </div>
  );
}
