import Link from "next/link";
import { findPromotions, isPromotionActive } from "@/features/promotion/promotion.repo";
import { Button } from "@/components/ui/button";
import { DeletePromotionButton } from "./delete-promotion-button";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function PromotionsPage() {
  const promotions = await findPromotions(false);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">จัดโปร (ลดราคาสินค้า)</h1>
        <Button asChild>
          <Link href="/dashboard/promotions/add">เพิ่มโปร</Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 font-medium">ชื่อโปร</th>
                <th className="px-4 py-3 font-medium">ส่วนลด</th>
                <th className="px-4 py-3 font-medium">เริ่มต้น</th>
                <th className="px-4 py-3 font-medium">สิ้นสุด</th>
                <th className="px-4 py-3 font-medium">จำนวนสินค้า</th>
                <th className="px-4 py-3 font-medium">สถานะ</th>
                <th className="px-4 py-3 text-right font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {promotions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    ยังไม่มีโปร สร้างโปรลดราคาและเลือกสินค้าได้
                  </td>
                </tr>
              ) : (
                promotions.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3">{p.discountPercent}%</td>
                    <td className="px-4 py-3">{formatDate(p.startAt as Date)}</td>
                    <td className="px-4 py-3">{formatDate(p.endAt as Date)}</td>
                    <td className="px-4 py-3">{p.productIds.length}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          isPromotionActive(p)
                            ? "text-green-600"
                            : "text-muted-foreground"
                        }
                      >
                        {isPromotionActive(p) ? "กำลังเปิด" : "หมดแล้ว/ยังไม่เริ่ม"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/promotions/${p.id}/edit`}>
                            แก้ไข
                          </Link>
                        </Button>
                        <DeletePromotionButton promotionId={p.id} />
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
