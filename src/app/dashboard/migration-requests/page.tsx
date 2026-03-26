import Link from "next/link";
import { listMigrationRequests } from "@/features/migration-request/migration-request.repo";
import type { MigrationStatus } from "@/db/schema/migration-request.schema";

export const metadata = { title: "คำขอย้ายข้อมูล | แดชบอร์ด" };

const STATUS_LABEL: Record<MigrationStatus, string> = {
  pending: "รอตรวจสอบ",
  reviewing: "กำลังดำเนินการ",
  done: "เสร็จสิ้น",
  rejected: "ปฏิเสธ",
};

const STATUS_STYLE: Record<MigrationStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  reviewing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  done: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const STOCK_TYPE_LABEL: Record<string, string> = {
  individual: "Individual",
  family: "Family",
  invite: "Invite",
  customer_account: "Customer Account",
};

export default async function MigrationRequestsPage() {
  const requests = await listMigrationRequests();

  const pending = requests.filter((r) => r.status === "pending").length;
  const reviewing = requests.filter((r) => r.status === "reviewing").length;
  const done = requests.filter((r) => r.status === "done").length;
  const rejected = requests.filter((r) => r.status === "rejected").length;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">คำขอย้ายข้อมูลจากระบบเดิม</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ลูกค้าที่ต้องการย้ายข้อมูลจาก service เดิมเข้าระบบ
        </p>
      </div>

      {/* summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "ทั้งหมด", value: requests.length, cls: "text-foreground" },
          { label: "รอตรวจสอบ", value: pending, cls: "text-yellow-600" },
          { label: "กำลังดำเนินการ", value: reviewing, cls: "text-blue-600" },
          { label: "เสร็จสิ้น", value: done, cls: "text-green-600" },
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
                <th className="px-4 py-3 text-left font-medium">ลูกค้า / อีเมลติดต่อ</th>
                <th className="px-4 py-3 text-left font-medium">ประเภท</th>
                <th className="px-4 py-3 text-left font-medium">Email เดิม</th>
                <th className="px-4 py-3 text-left font-medium">สถานะ</th>
                <th className="px-4 py-3 text-left font-medium">วันที่</th>
                <th className="px-4 py-3 text-left font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    ยังไม่มีคำขอ
                  </td>
                </tr>
              ) : (
                requests.map((r) => {
                  const status = r.status as MigrationStatus;
                  return (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        #{r.id}
                      </td>
                      <td className="px-4 py-3">
                        {r.customerName ? (
                          <p className="font-medium">{r.customerName}</p>
                        ) : (
                          <p className="text-muted-foreground text-xs">ไม่ได้ login</p>
                        )}
                        <p className="text-xs text-muted-foreground">{r.contactEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-md border px-2 py-0.5 text-xs font-medium">
                          {STOCK_TYPE_LABEL[r.stockType] ?? r.stockType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                        {r.loginEmail}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}
                        >
                          {STATUS_LABEL[status]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/migration-requests/${r.id}`}
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
