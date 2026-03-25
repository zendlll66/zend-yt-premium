import Link from "next/link";
import { Button } from "@/components/ui/button";
import { listCoupons } from "@/features/coupon/coupon.repo";
import { DeleteCouponButton } from "./delete-coupon-button";
import { ToggleCouponButton } from "./toggle-coupon-button";

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

export default async function CouponsPage() {
  const coupons = await listCoupons();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Coupon / รหัสส่วนลด</h1>
          <p className="text-sm text-muted-foreground">จัดการรหัสส่วนลดสำหรับลูกค้า</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/coupons/add">+ เพิ่ม Coupon</Link>
        </Button>
      </div>

      {coupons.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          ยังไม่มี coupon
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">รหัส</th>
                <th className="px-4 py-3 text-left font-medium">ชื่อ</th>
                <th className="px-4 py-3 text-left font-medium">ส่วนลด</th>
                <th className="px-4 py-3 text-left font-medium">ขั้นต่ำ</th>
                <th className="px-4 py-3 text-left font-medium">ใช้แล้ว/สูงสุด</th>
                <th className="px-4 py-3 text-left font-medium">หมดอายุ</th>
                <th className="px-4 py-3 text-left font-medium">สถานะ</th>
                <th className="px-4 py-3 text-right font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono font-semibold">{c.code}</td>
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {c.discountType === "percent"
                      ? `${c.discountValue}%`
                      : `฿${c.discountValue.toLocaleString("th-TH")}`}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {c.minOrderAmount > 0
                      ? `฿${c.minOrderAmount.toLocaleString("th-TH")}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {c.usedCount} / {c.maxUses ?? "∞"}
                  </td>
                  <td className="px-4 py-3">{formatDate(c.expiresAt)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.isActive
                          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.isActive ? "เปิดใช้" : "ปิด"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <ToggleCouponButton id={c.id} isActive={c.isActive} />
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/coupons/${c.id}/edit`}>แก้ไข</Link>
                      </Button>
                      <DeleteCouponButton id={c.id} code={c.code} />
                    </div>
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
