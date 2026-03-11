import { findAllCustomerMemberships } from "@/features/membership/membership.repo";

function formatDate(d: Date | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STATUS_LABEL: Record<string, string> = {
  active: "ใช้งาน",
  expired: "หมดอายุ",
  cancelled: "ยกเลิก",
};

export default async function MembershipsPage() {
  const list = await findAllCustomerMemberships(200);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="text-xl font-semibold">รายการสมัครสมาชิก</h1>

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 font-medium">ลูกค้า</th>
                <th className="px-4 py-3 font-medium">แผน</th>
                <th className="px-4 py-3 font-medium">ประเภท</th>
                <th className="px-4 py-3 font-medium">เริ่ม</th>
                <th className="px-4 py-3 font-medium">หมดอายุ</th>
                <th className="px-4 py-3 font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    ยังไม่มีรายการสมัครสมาชิก
                  </td>
                </tr>
              ) : (
                list.map((m) => (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{m.customerName}</p>
                      <p className="text-muted-foreground">{m.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3">{m.plan.name}</td>
                    <td className="px-4 py-3">
                      {m.plan.billingType === "monthly" ? "รายเดือน" : "รายปี"}
                    </td>
                    <td className="px-4 py-3">{formatDate(m.startedAt)}</td>
                    <td className="px-4 py-3">{formatDate(m.expiresAt)}</td>
                    <td className="px-4 py-3">{STATUS_LABEL[m.status] ?? m.status}</td>
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
