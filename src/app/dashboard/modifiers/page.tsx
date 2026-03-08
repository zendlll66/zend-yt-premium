import Link from "next/link";
import { findAllModifierGroups } from "@/features/modifier/modifier.repo";
import { Button } from "@/components/ui/button";
import { ModifierGroupRowActions } from "./modifier-group-row-actions";

export default async function ModifiersPage() {
  const groups = await findAllModifierGroups();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">ตัวเลือกสินค้า (Modifiers)</h1>
        <Button asChild>
          <Link href="/dashboard/modifiers/add">เพิ่มกลุ่มตัวเลือก</Link>
        </Button>
      </div>

      <p className="text-muted-foreground text-sm">
        กำหนดกลุ่มตัวเลือก (เช่น Size, นม) และรายการในแต่ละกลุ่ม (เช่น S/M/L, Oat milk) แล้วไปผูกกับสินค้าในหน้าแก้ไขสินค้า
      </p>

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 font-medium">ชื่อกลุ่ม</th>
                <th className="px-4 py-3 font-medium">บังคับเลือก</th>
                <th className="px-4 py-3 font-medium">ตัวเลือก</th>
                <th className="px-4 py-3 text-right font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    ยังไม่มีกลุ่มตัวเลือก
                  </td>
                </tr>
              ) : (
                groups.map((g) => (
                  <tr key={g.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{g.name}</td>
                    <td className="px-4 py-3">
                      {g.required ? (
                        <span className="text-amber-600 dark:text-amber-400">ใช่</span>
                      ) : (
                        <span className="text-muted-foreground">ไม่บังคับ</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {g.modifiers.length === 0 ? (
                        <span className="text-muted-foreground">ยังไม่มีตัวเลือก</span>
                      ) : (
                        <ul className="flex flex-wrap gap-x-2 gap-y-1">
                          {g.modifiers.map((m) => (
                            <li key={m.id} className="text-muted-foreground">
                              {m.name}
                              {m.price > 0 ? ` +${m.price}฿` : ""}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ModifierGroupRowActions id={g.id} />
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
