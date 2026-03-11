import {
  getDashboardStats,
  getRevenueByDay,
  getTopProducts,
  getRecentOrders,
} from "@/features/dashboard/dashboard.repo";
import { DisplayScreen } from "./_components/display-screen";
import type { ViewType } from "./_components/display-screen";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const VIEW_TYPES: ViewType[] = ["orders", "stats", "revenue", "top", "recent"];

function parseView(s: string | undefined): ViewType {
  if (s && VIEW_TYPES.includes(s as ViewType)) return s as ViewType;
  return "orders";
}

function parseLayout(s: string | undefined): "full" | "split" | "grid2" {
  if (s === "split" || s === "grid2") return s;
  return "full";
}

export default async function DisplayPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const layout = parseLayout(params.layout as string | undefined);
  const view = parseView(params.view as string | undefined);
  const left = parseView(params.left as string | undefined);
  const right = parseView(params.right as string | undefined);
  const v1 = parseView(params.v1 as string | undefined);
  const v2 = parseView(params.v2 as string | undefined);
  const v3 = parseView(params.v3 as string | undefined);
  const v4 = parseView(params.v4 as string | undefined);

  const [stats, revenueByDay, topProducts, recentOrders] = await Promise.all([
    getDashboardStats(),
    getRevenueByDay(7),
    getTopProducts(10),
    getRecentOrders(16),
  ]);

  return (
    <DisplayScreen
      layout={layout}
      view={view}
      left={left}
      right={right}
      v1={v1}
      v2={v2}
      v3={v3}
      v4={v4}
      stats={stats}
      revenueByDay={revenueByDay}
      topProducts={topProducts}
      recentOrders={recentOrders}
    />
  );
}
