import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { getCustomerTickets } from "@/features/support/support-ticket.repo";
import { TICKET_STATUS_LABELS, type TicketStatus } from "@/db/schema/support-ticket.schema";
import { Plus, TicketCheck } from "lucide-react";

const STATUS_STYLE: Record<TicketStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  closed: "bg-muted text-muted-foreground",
};

export const metadata = { title: "แจ้งปัญหา" };

export default async function SupportPage() {
  const customer = await getCustomerSession();
  if (!customer) redirect("/customer-login?from=/account/support");

  const tickets = await getCustomerTickets(customer.id);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">แจ้งปัญหา / Support</h1>
          <p className="text-sm text-muted-foreground mt-0.5">ติดตามสถานะการแก้ไขปัญหาของคุณ</p>
        </div>
        <Link
          href="/account/support/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
        >
          <Plus className="h-4 w-4" />
          แจ้งปัญหาใหม่
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center space-y-3">
          <TicketCheck className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">ยังไม่มีรายการแจ้งปัญหา</p>
          <Link
            href="/account/support/new"
            className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted transition"
          >
            <Plus className="h-4 w-4" />
            แจ้งปัญหาครั้งแรก
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {tickets.map((t) => {
            const status = t.status as TicketStatus;
            return (
              <li key={t.id}>
                <Link
                  href={`/account/support/${t.id}`}
                  className="flex items-start justify-between gap-3 rounded-2xl border bg-card p-4 hover:bg-muted/50 transition"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{t.subject}</p>
                    {t.orderNumber && (
                      <p className="text-xs text-muted-foreground font-mono">
                        Order #{t.orderNumber}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(t.createdAt).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}
                  >
                    {TICKET_STATUS_LABELS[status]}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
