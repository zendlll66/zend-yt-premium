import { findRecentAuditLogs } from "@/features/audit/audit.repo";

export const metadata = {
  title: "บันทึกการใช้งาน | แดชบอร์ด",
  description: "Audit log — ใครทำอะไรเมื่อไหร่",
};

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(d));
}

export default async function AuditLogPage() {
  const logs = await findRecentAuditLogs(200);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">บันทึกการใช้งาน (Audit log)</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ใครทำอะไรเมื่อไหร่ — แก้ไขออเดอร์ เปลี่ยนราคา ลบข้อมูล ฯลฯ
        </p>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">เวลา</th>
                <th className="px-4 py-3 text-left font-medium">ผู้ใช้</th>
                <th className="px-4 py-3 text-left font-medium">การกระทำ</th>
                <th className="px-4 py-3 text-left font-medium">ประเภท</th>
                <th className="px-4 py-3 text-left font-medium">รหัส</th>
                <th className="px-4 py-3 text-left font-medium">รายละเอียด</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    ยังไม่มีบันทึก
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0">
                    <td className="whitespace-nowrap px-4 py-2">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-2">{log.adminName ?? "—"}</td>
                    <td className="px-4 py-2 font-medium">{log.action}</td>
                    <td className="px-4 py-2">{log.entityType}</td>
                    <td className="px-4 py-2">{log.entityId ?? "—"}</td>
                    <td className="max-w-xs truncate px-4 py-2 text-muted-foreground" title={log.details ?? ""}>
                      {log.details ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
