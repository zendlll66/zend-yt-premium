import Link from "next/link";
import { findActiveInventories } from "@/features/inventory/inventory-dashboard.repo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function formatDate(d: Date | null) {
  if (!d) return "-";
  return new Date(d).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
}

function daysLeft(expiresAt: Date | null) {
  if (!expiresAt) return null;
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  // ให้สอดคล้องกับหน้า “รหัสของฉัน” (นับวันแบบ ceil)
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

export default async function ActiveInventoryOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const q = (params.q ?? "").trim().toLowerCase();
  const rows = await findActiveInventories();
  const filteredRows = !q
    ? rows
    : rows.filter((row) => {
        const orderNumber = String(row.orderNumber ?? row.orderId ?? "");
        const customerText = `${row.customerName ?? ""} ${row.customerEmail ?? ""} ${row.customerLineDisplayName ?? ""}`;
        const title = row.title ?? "";
        return (
          orderNumber.toLowerCase().includes(q) ||
          customerText.toLowerCase().includes(q) ||
          title.toLowerCase().includes(q)
        );
      });

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Order ที่ยังใช้งาน (Active)</h1>
          <p className="text-sm text-muted-foreground">
            รวมรายการ inventory ทั้งหมดที่ยังไม่หมดอายุ แยกตาม order
          </p>
        </div>
        <div className="flex gap-2">
          <form className="flex items-center gap-2" method="get">
            <input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="ค้นหาลูกค้า / ออเดอร์ / แพ็กเกจ"
              className="h-9 w-[260px] rounded-md border bg-background px-3 text-sm"
            />
            <Button type="submit" size="sm" variant="outline">ค้นหา</Button>
          </form>
          <Button size="sm" asChild>
            <Link href="/dashboard/inventory/orders/add">+ เพิ่ม Order</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">← กลับหน้า Dashboard</Link>
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-muted-foreground font-mono text-xs">Order ID</th>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">ลูกค้า</th>
                <th className="px-3 py-2">ประเภท</th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">วันคงเหลือ</th>
                <th className="px-3 py-2">หมดอายุ</th>
                <th className="px-3 py-2 w-[100px]">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-6 text-center text-sm text-muted-foreground"
                  >
                    ยังไม่มี inventory ที่ใช้งานอยู่
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const d = daysLeft(row.expiresAt);
                  return (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground select-all">
                        {row.orderId ?? row.id}
                      </td>
                      <td className="px-3 py-2">
                        {row.orderId ? (
                          <Link
                            href={`/dashboard/orders/${row.orderId}`}
                            className="font-medium text-primary hover:underline"
                          >
                            #{row.orderNumber ?? row.orderId}
                          </Link>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {row.customerId ? (
                          <Link
                            href={`/dashboard/customers/${row.customerId}`}
                            className="inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs hover:bg-muted"
                          >
                            {row.customerLinePictureUrl ? (
                              <img
                                src={row.customerLinePictureUrl}
                                alt=""
                                className="h-5 w-5 rounded-full object-cover"
                              />
                            ) : (
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px]">
                                U
                              </span>
                            )}
                            <span className="max-w-[160px] truncate">
                              {row.customerLineDisplayName ??
                                row.customerName ??
                                row.customerEmail ??
                                `#${row.customerId}`}
                            </span>
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline">{row.itemType}</Badge>
                      </td>
                      <td className="px-3 py-2 max-w-[220px] truncate" title={row.title ?? ""}>
                        {row.title}
                      </td>
                      <td className="px-3 py-2">
                        {d != null ? (
                          <span className={d <= 3 ? "text-destructive font-medium" : ""}>
                            {d} วัน
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {formatDate(row.expiresAt ?? null)}
                      </td>
                      <td className="px-3 py-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/inventory/orders/${row.id}/edit`}>
                            แก้ไข
                          </Link>
                        </Button>
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

