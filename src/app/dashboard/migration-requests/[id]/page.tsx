import { notFound } from "next/navigation";
import Link from "next/link";
import { getMigrationRequestById } from "@/features/migration-request/migration-request.repo";
import { UpdateStatusForm } from "./update-status-form";
import type { MigrationStatus } from "@/db/schema/migration-request.schema";

export const metadata = { title: "คำขอย้ายข้อมูล | แดชบอร์ด" };

const STATUS_LABEL: Record<MigrationStatus, string> = {
  pending: "รอตรวจสอบ",
  reviewing: "กำลังดำเนินการ",
  done: "เสร็จสิ้น",
  rejected: "ปฏิเสธ",
};

const STATUS_STYLE: Record<MigrationStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  reviewing: "bg-blue-100 text-blue-800",
  done: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const STOCK_TYPE_LABEL: Record<string, string> = {
  individual: "Individual Account",
  family: "Family Group",
  invite: "Invite Link",
  customer_account: "Customer Account",
};

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-3">
      <span className="w-36 shrink-0 text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-xs" : ""}>{value}</span>
    </div>
  );
}

export default async function MigrationRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const request = await getMigrationRequestById(parseInt(id, 10));
  if (!request) notFound();

  const status = request.status as MigrationStatus;

  return (
    <div className="flex flex-1 flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/migration-requests"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← กลับ
        </Link>
        <h1 className="text-xl font-semibold">คำขอ #{request.id}</h1>
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}
        >
          {STATUS_LABEL[status]}
        </span>
      </div>

      {/* ข้อมูลลูกค้า */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          ข้อมูลผู้ส่งคำขอ
        </h2>
        <div className="grid gap-2 text-sm">
          <Row label="ลูกค้า" value={request.customerName ?? "ไม่ได้ login"} />
          <Row label="อีเมลลูกค้า" value={request.customerEmail ?? "—"} />
          <Row label="อีเมลติดต่อกลับ" value={request.contactEmail} />
          <Row
            label="วันที่ส่งคำขอ"
            value={new Date(request.createdAt).toLocaleDateString("th-TH", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
        </div>
      </div>

      {/* ข้อมูล service เดิม */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          ข้อมูล Service เดิม
        </h2>
        <div className="grid gap-2 text-sm">
          <Row
            label="ประเภทสินค้า"
            value={STOCK_TYPE_LABEL[request.stockType] ?? request.stockType}
          />
          <Row label="Email เดิม" value={request.loginEmail} mono />
          {request.loginPassword ? (
            <Row label="Password เดิม" value={request.loginPassword} mono />
          ) : (
            <Row label="Password เดิม" value="— (Invite type ไม่มี password)" />
          )}
          {request.note && <Row label="หมายเหตุ" value={request.note} />}
        </div>
      </div>

      {/* อัปเดตสถานะ */}
      <UpdateStatusForm
        requestId={request.id}
        currentStatus={status}
        currentAdminNote={request.adminNote ?? ""}
      />
    </div>
  );
}
