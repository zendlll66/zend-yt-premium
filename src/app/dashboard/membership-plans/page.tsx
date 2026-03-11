import Link from "next/link";
import { findMembershipPlans } from "@/features/membership/membership.repo";
import { Button } from "@/components/ui/button";
import { DeletePlanButton } from "./delete-plan-button";

function formatMoney(n: number) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

const BILLING_LABEL: Record<string, string> = {
  monthly: "รายเดือน",
  yearly: "รายปี",
};

export default async function MembershipPlansPage() {
  const plans = await findMembershipPlans(false);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">แผนสมาชิก (รายเดือน/รายปี)</h1>
        <Button asChild>
          <Link href="/dashboard/membership-plans/add">เพิ่มแผน</Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 font-medium">ชื่อ</th>
                <th className="px-4 py-3 font-medium">ประเภท</th>
                <th className="px-4 py-3 font-medium">ราคา</th>
                <th className="px-4 py-3 font-medium">วันเช่าฟรี</th>
                <th className="px-4 py-3 font-medium">ส่วนลด %</th>
                <th className="px-4 py-3 font-medium">สถานะ</th>
                <th className="px-4 py-3 text-right font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    ยังไม่มีแผน สร้างแผนรายเดือนหรือรายปีได้
                  </td>
                </tr>
              ) : (
                plans.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3">{BILLING_LABEL[p.billingType] ?? p.billingType}</td>
                    <td className="px-4 py-3">{formatMoney(p.price)} ฿</td>
                    <td className="px-4 py-3">{p.freeRentalDays > 0 ? `${p.freeRentalDays} วัน` : "-"}</td>
                    <td className="px-4 py-3">{p.discountPercent > 0 ? `${p.discountPercent}%` : "-"}</td>
                    <td className="px-4 py-3">
                      <span className={p.isActive ? "text-green-600" : "text-muted-foreground"}>
                        {p.isActive ? "เปิดใช้" : "ปิด"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/membership-plans/${p.id}/edit`}>แก้ไข</Link>
                        </Button>
                        <DeletePlanButton planId={p.id} />
                      </div>
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
