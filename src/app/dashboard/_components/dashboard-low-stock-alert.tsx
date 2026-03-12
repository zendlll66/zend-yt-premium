import Link from "next/link";
import { AlertTriangle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProductListItem } from "@/features/product/product.repo";

type Props = { products: ProductListItem[] };

export function DashboardLowStockAlert({ products }: Props) {
  if (products.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-amber-800 dark:text-amber-200">
            แจ้งเตือนสต็อกต่ำ ({products.length} รายการ)
          </p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
            สินค้าเหล่านี้มีจำนวนคงคลังไม่เกินเกณฑ์ที่ตั้งไว้
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {products.slice(0, 8).map((p) => (
              <li key={p.id} className="rounded bg-amber-100 px-2 py-1 text-sm dark:bg-amber-900/40">
                {p.name}: {p.stock}
                {p.lowStockThreshold != null ? ` (เกณฑ์ ${p.lowStockThreshold})` : ""}
              </li>
            ))}
            {products.length > 8 && (
              <li className="text-sm text-amber-600 dark:text-amber-400">+ อีก {products.length - 8} รายการ</li>
            )}
          </ul>
          <Button size="sm" variant="outline" className="mt-3 border-amber-300 dark:border-amber-700" asChild>
            <Link href="/dashboard/products">
              <Package className="mr-1.5 h-4 w-4" />
              ไปจัดการสินค้า
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
