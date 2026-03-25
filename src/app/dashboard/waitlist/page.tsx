import { listAllWaitlist } from "@/features/waitlist/waitlist.repo";
import { NotifyWaitlistButton } from "./notify-waitlist-button";

export default async function WaitlistPage() {
  const waitlist = await listAllWaitlist();

  // จัดกลุ่มตามสินค้า
  const grouped = new Map<
    number,
    { productName: string | null; items: typeof waitlist }
  >();
  for (const item of waitlist) {
    const existing = grouped.get(item.productId);
    if (existing) {
      existing.items.push(item);
    } else {
      grouped.set(item.productId, { productName: item.productName, items: [item] });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Waitlist</h1>
        <p className="text-sm text-muted-foreground">ลูกค้าที่รอสินค้าหมด stock</p>
      </div>

      {waitlist.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          ยังไม่มีรายการ waitlist
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([productId, { productName, items }]) => (
            <div key={productId} className="rounded-xl border bg-card">
              <div className="flex items-center justify-between border-b px-5 py-3">
                <div>
                  <h2 className="font-semibold">{productName ?? `Product #${productId}`}</h2>
                  <p className="text-sm text-muted-foreground">{items.length} คน รอ</p>
                </div>
                <NotifyWaitlistButton productId={productId} productName={productName ?? ""} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/30">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">ลูกค้า</th>
                      <th className="px-4 py-2 text-left font-medium">อีเมล</th>
                      <th className="px-4 py-2 text-left font-medium">LINE</th>
                      <th className="px-4 py-2 text-left font-medium">วันที่สมัคร</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/20">
                        <td className="px-4 py-2">{item.customerName ?? "—"}</td>
                        <td className="px-4 py-2 text-muted-foreground">{item.customerEmail}</td>
                        <td className="px-4 py-2">
                          {item.customerLineUserId ? (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                              มี LINE
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">ไม่มี</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString("th-TH")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
