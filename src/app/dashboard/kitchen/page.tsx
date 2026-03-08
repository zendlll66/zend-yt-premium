import { findOrdersForKitchen } from "@/features/order/order.repo";
import { findAllKitchenCategories } from "@/features/kitchen-category/kitchen-category.repo";
import { KitchenOrderCards } from "./kitchen-order-cards";

type Props = { searchParams: Promise<{ station?: string }> };

function formatTime(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function KitchenPage({ searchParams }: Props) {
  const { station } = await searchParams;
  const stationId = station ? parseInt(station, 10) : null;
  const [orders, kitchenCategories] = await Promise.all([
    findOrdersForKitchen(Number.isFinite(stationId) ? stationId : undefined),
    findAllKitchenCategories(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Kitchen Display</h1>
        <div className="flex flex-wrap gap-2">
          <a
            href="/dashboard/kitchen"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${!stationId ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            ทั้งหมด
          </a>
          {kitchenCategories.map((k) => (
            <a
              key={k.id}
              href={`/dashboard/kitchen?station=${k.id}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${stationId === k.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {k.name}
            </a>
          ))}
        </div>
      </div>

      <p className="text-muted-foreground text-sm">
        บิลที่ status = รอจัดเตรียม หรือ กำลังจัดเตรียม
        {stationId ? ` (Station ที่เลือก)` : ""}
      </p>

      <KitchenOrderCards orders={orders} />
    </div>
  );
}
