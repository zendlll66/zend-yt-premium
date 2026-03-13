import Link from "next/link";
import { findAllProducts } from "@/features/product/product.repo";
import { Button } from "@/components/ui/button";
import { ProductRowActions } from "./product-row-actions";

function formatDate(d: Date | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function getStockTypeLabel(stockType: string) {
  if (stockType === "individual") return "Individual";
  if (stockType === "family") return "Family";
  if (stockType === "invite") return "Invite Link";
  if (stockType === "customer_account") return "Customer Account";
  return stockType;
}

export default async function ProductsPage() {
  const products = await findAllProducts();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">จัดการแพ็กเกจ</h1>
        <Button asChild>
          <Link href="/dashboard/products/add">เพิ่มแพ็กเกจ</Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 font-medium">รูป</th>
                <th className="px-4 py-3 font-medium">ชื่อแพ็กเกจ</th>
                <th className="px-4 py-3 font-medium">หมวดหมู่</th>
                <th className="px-4 py-3 font-medium">ราคาขาย</th>
                <th className="px-4 py-3 font-medium">ราคาเดิม</th>
                <th className="px-4 py-3 font-medium">ประเภทสต็อก</th>
                <th className="px-4 py-3 font-medium">สถานะ</th>
                <th className="px-4 py-3 font-medium">สร้างเมื่อ</th>
                <th className="px-4 py-3 text-right font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    ยังไม่มีแพ็กเกจ
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      {p.imageUrl ? (
                        <img
                          src={`/api/r2-url?key=${encodeURIComponent(p.imageUrl)}`}
                          alt=""
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.categoryName ?? "-"}
                    </td>
                    <td className="px-4 py-3">{formatMoney(p.price)} ฿</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.deposit != null && p.deposit > 0 ? `${formatMoney(p.deposit)} ฿` : "-"}
                    </td>
                    <td className="px-4 py-3">{getStockTypeLabel(p.stockType)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          p.isActive
                            ? "text-green-600 dark:text-green-400"
                            : "text-muted-foreground"
                        }
                      >
                        {p.isActive ? "เปิดขาย" : "ปิด"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(p.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ProductRowActions
                        id={p.id}
                        isActive={p.isActive}
                        imageUrl={p.imageUrl}
                      />
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
