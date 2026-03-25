import { listNotificationLogs } from "@/features/notification/notification.repo";

const TYPE_LABELS: Record<string, string> = {
  order_confirm: "ยืนยัน Order",
  order_paid: "ชำระเงินแล้ว",
  order_fulfilled: "ส่งมอบแล้ว",
  order_cancelled: "ยกเลิก Order",
  inventory_expiring: "ใกล้หมดอายุ",
  inventory_expired: "หมดอายุแล้ว",
  waitlist_available: "Waitlist มี Stock",
  wallet_credit: "เติม Wallet",
  wallet_debit: "ใช้ Wallet",
};

const CHANNEL_LABELS: Record<string, string> = {
  line: "LINE",
  email: "Email",
};

export default async function NotificationsPage() {
  const logs = await listNotificationLogs(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">ประวัติการแจ้งเตือน</h1>
        <p className="text-sm text-muted-foreground">บันทึก notification ทุกช่องทาง</p>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          ยังไม่มีประวัติการแจ้งเตือน
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">วันที่</th>
                <th className="px-4 py-3 text-left font-medium">ประเภท</th>
                <th className="px-4 py-3 text-left font-medium">ช่องทาง</th>
                <th className="px-4 py-3 text-left font-medium">ลูกค้า</th>
                <th className="px-4 py-3 text-left font-medium">Order</th>
                <th className="px-4 py-3 text-left font-medium">สถานะ</th>
                <th className="px-4 py-3 text-left font-medium">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.sentAt).toLocaleString("th-TH")}
                  </td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      {TYPE_LABELS[log.type] ?? log.type}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        log.channel === "line"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                      }`}
                    >
                      {CHANNEL_LABELS[log.channel] ?? log.channel}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {log.customerName ? (
                      <span>{log.customerName}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">{log.recipient.slice(0, 20)}…</span>
                    )}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">
                    {log.orderNumber ?? "—"}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        log.status === "sent"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                          : log.status === "failed"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {log.status === "sent" ? "ส่งแล้ว" : log.status === "failed" ? "ล้มเหลว" : "ข้ามไป"}
                    </span>
                  </td>
                  <td className="max-w-xs px-4 py-2 text-xs text-destructive">
                    {log.error ? (
                      <span title={log.error}>{log.error.slice(0, 40)}{log.error.length > 40 ? "…" : ""}</span>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
