import Link from "next/link";
import { findAllCategories } from "@/features/category/category.repo";
import { Button } from "@/components/ui/button";
import { CategoryRowActions } from "./category-row-actions";

export default async function CategoriesPage() {
  const list = await findAllCategories();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">หมวดหมู่สินค้า</h1>
        <Button asChild>
          <Link href="/dashboard/categories/add">เพิ่มหมวดหมู่</Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 font-medium">ชื่อ</th>
                <th className="px-4 py-3 text-right font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">
                    ยังไม่มีหมวดหมู่
                  </td>
                </tr>
              ) : (
                list.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-right">
                      <CategoryRowActions id={c.id} />
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
