"use client";

import type { DashboardStats, RevenueByDayItem, TopProductItem, RecentOrderItem } from "@/features/dashboard/dashboard.repo";
import {
  DisplayOrdersView,
  DisplayStatsView,
  DisplayRevenueView,
  DisplayTopView,
  DisplayRecentView,
} from "./display-views";

export type ViewType = "orders" | "stats" | "revenue" | "top" | "recent";

type DisplayScreenProps = {
  layout: "full" | "split" | "grid2";
  view?: ViewType;
  left?: ViewType;
  right?: ViewType;
  v1?: ViewType;
  v2?: ViewType;
  v3?: ViewType;
  v4?: ViewType;
  stats: DashboardStats;
  revenueByDay: RevenueByDayItem[];
  topProducts: TopProductItem[];
  recentOrders: RecentOrderItem[];
};

function ViewCell({
  type,
  stats,
  revenueByDay,
  topProducts,
  recentOrders,
}: {
  type: ViewType;
  stats: DashboardStats;
  revenueByDay: RevenueByDayItem[];
  topProducts: TopProductItem[];
  recentOrders: RecentOrderItem[];
}) {
  switch (type) {
    case "orders":
      return (
        <DisplayOrdersView
          ordersByStatus={stats.ordersByStatus}
          totalOrders={stats.totalOrders}
          paidOrders={stats.paidOrders}
        />
      );
    case "stats":
      return <DisplayStatsView stats={stats} />;
    case "revenue":
      return <DisplayRevenueView revenueByDay={revenueByDay} />;
    case "top":
      return <DisplayTopView topProducts={topProducts} />;
    case "recent":
      return <DisplayRecentView orders={recentOrders} />;
    default:
      return (
        <DisplayOrdersView
          ordersByStatus={stats.ordersByStatus}
          totalOrders={stats.totalOrders}
          paidOrders={stats.paidOrders}
        />
      );
  }
}

export function DisplayScreen({
  layout,
  view = "orders",
  left = "orders",
  right = "recent",
  v1 = "orders",
  v2 = "stats",
  v3 = "revenue",
  v4 = "top",
  stats,
  revenueByDay,
  topProducts,
  recentOrders,
}: DisplayScreenProps) {
  const cellClass = "min-h-0 flex-1";
  const data = { stats, revenueByDay, topProducts, recentOrders };

  if (layout === "full") {
    return (
      <div className="flex h-screen w-full flex-col p-4">
        <ViewCell type={view} {...data} />
      </div>
    );
  }

  if (layout === "split") {
    return (
      <div className="flex h-screen w-full gap-4 p-4">
        <div className={`${cellClass} w-1/2`}>
          <ViewCell type={left} {...data} />
        </div>
        <div className={`${cellClass} w-1/2`}>
          <ViewCell type={right} {...data} />
        </div>
      </div>
    );
  }

  if (layout === "grid2") {
    return (
      <div className="grid h-screen w-full grid-cols-2 grid-rows-2 gap-4 p-4">
        <div className={cellClass}>
          <ViewCell type={v1} {...data} />
        </div>
        <div className={cellClass}>
          <ViewCell type={v2} {...data} />
        </div>
        <div className={cellClass}>
          <ViewCell type={v3} {...data} />
        </div>
        <div className={cellClass}>
          <ViewCell type={v4} {...data} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col p-4">
      <ViewCell type="orders" {...data} />
    </div>
  );
}
