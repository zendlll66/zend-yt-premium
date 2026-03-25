import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, CheckCircle2, Clock, Wrench, XCircle } from "lucide-react";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { getCustomerTicketById } from "@/features/support/support-ticket.repo";
import { TICKET_STATUS_LABELS, type TicketStatus } from "@/db/schema/support-ticket.schema";

const STEPS: { status: TicketStatus; label: string; icon: React.ReactNode }[] = [
  { status: "pending", label: "รอรับเรื่อง", icon: <Clock className="h-4 w-4" /> },
  { status: "in_progress", label: "กำลังแก้ไข", icon: <Wrench className="h-4 w-4" /> },
  { status: "resolved", label: "แก้ไขเรียบร้อย", icon: <CheckCircle2 className="h-4 w-4" /> },
];

const STATUS_ORDER: Record<TicketStatus, number> = {
  pending: 0,
  in_progress: 1,
  resolved: 2,
  closed: 3,
};

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomerSession();
  if (!customer) redirect(`/customer-login?from=/account/support/${id}`);

  const ticketId = parseInt(id, 10);
  if (!ticketId) notFound();

  const ticket = await getCustomerTicketById(ticketId, customer.id);
  if (!ticket) notFound();

  const status = ticket.status as TicketStatus;
  const statusIndex = STATUS_ORDER[status] ?? 0;
  const isClosed = status === "closed";

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/account/support"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition mb-3"
        >
          <ChevronLeft className="h-4 w-4" />
          รายการ Ticket
        </Link>
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-lg font-semibold">{ticket.subject}</h1>
          <span className="shrink-0 font-mono text-xs text-muted-foreground">#{ticket.id}</span>
        </div>
        {ticket.orderNumber && (
          <p className="text-sm text-muted-foreground font-mono mt-0.5">
            Order #{ticket.orderNumber}
          </p>
        )}
      </div>

      {/* Stepper สถานะ */}
      {!isClosed ? (
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="text-sm font-medium mb-4">สถานะการดำเนินการ</h2>
          <div className="relative flex justify-between">
            {/* connector line */}
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-border" />
            <div
              className="absolute top-5 left-5 h-0.5 bg-primary transition-all"
              style={{ width: `${(statusIndex / (STEPS.length - 1)) * (100 - (10 / STEPS.length))}%` }}
            />
            {STEPS.map((step, idx) => {
              const done = idx < statusIndex;
              const active = idx === statusIndex;
              return (
                <div key={step.status} className="relative z-10 flex flex-col items-center gap-2">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                      done
                        ? "border-primary bg-primary text-primary-foreground"
                        : active
                        ? "border-primary bg-background text-primary"
                        : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {done ? <CheckCircle2 className="h-5 w-5" /> : step.icon}
                  </div>
                  <span
                    className={`text-xs font-medium text-center max-w-[70px] ${
                      active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border bg-muted/50 p-4 flex items-center gap-3">
          <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">
            Ticket นี้ถูก{TICKET_STATUS_LABELS.closed}แล้ว
          </p>
        </div>
      )}

      {/* รายละเอียด */}
      <div className="rounded-2xl border bg-card p-5 space-y-3">
        <h2 className="text-sm font-medium">รายละเอียดปัญหา</h2>
        <p className="text-sm whitespace-pre-wrap text-foreground/90">{ticket.description}</p>
      </div>

      {/* หมายเหตุจาก Admin */}
      {ticket.adminNote && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-1.5">
          <h2 className="text-sm font-medium text-primary">ข้อความจากทีมงาน</h2>
          <p className="text-sm whitespace-pre-wrap">{ticket.adminNote}</p>
        </div>
      )}

      {/* วันที่ */}
      <p className="text-xs text-muted-foreground text-right">
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
  );
}
