import Link from "next/link";
import { listAllTickets } from "@/features/support/support-ticket.repo";
import { TICKET_STATUS_LABELS, type TicketStatus } from "@/db/schema/support-ticket.schema";

export const metadata = { title: "Support Tickets | แดชบอร์ด" };

const STATUS_STYLE: Record<TicketStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  closed: "bg-muted text-muted-foreground",
};

export default async function AdminSupportPage() {
  const tickets = await listAllTickets();

  const pending = tickets.filter((t) => t.status === "pending").length;
  const inProgress = tickets.filter((t) => t.status === "in_progress").length;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Support Tickets</h1>
        <p className="mt-1 text-sm text-muted-foreground">รับเรื่องและติดตามปัญหาจากลูกค้า</p>
      </div>

      {/* summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "ทั้งหมด", value: tickets.length, cls: "text-foreground" },
          { label: "รอรับเรื่อง", value: pending, cls: "text-yellow-600" },
          { label: "กำลังแก้ไข", value: inProgress, cls: "text-blue-600" },
          {
            label: "แก้ไขแล้ว",
            value: tickets.filter((t) => t.status === "resolved").length,
            cls: "text-green-600",
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-4 text-center">
            <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">#</th>
                <th className="px-4 py-3 text-left font-medium">ลูกค้า</th>
                <th className="px-4 py-3 text-left font-medium">หัวข้อ</th>
                <th className="px-4 py-3 text-left font-medium">Order</th>
                <th className="px-4 py-3 text-left font-medium">สถานะ</th>
                <th className="px-4 py-3 text-left font-medium">วันที่</th>
                <th className="px-4 py-3 text-left font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    ยังไม่มี Ticket
                  </td>
                </tr>
              ) : (
                tickets.map((t) => {
                  const status = t.status as TicketStatus;
                  return (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        #{t.id}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{t.customerName ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{t.customerEmail}</p>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="truncate font-medium">{t.subject}</p>
                        {t.adminNote && (
                          <p className="text-xs text-muted-foreground truncate">{t.adminNote}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                        {t.orderNumber ? `#${t.orderNumber}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}
                        >
                          {TICKET_STATUS_LABELS[status]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                        {new Date(t.createdAt).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/support/${t.id}`}
                          className="text-xs text-primary underline underline-offset-2"
                        >
                          จัดการ
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
