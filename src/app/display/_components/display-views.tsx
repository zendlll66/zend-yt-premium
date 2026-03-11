"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import type { DashboardStats, RevenueByDayItem, TopProductItem, RecentOrderItem } from "@/features/dashboard/dashboard.repo";
import { DashboardOrderStats } from "@/app/dashboard/_components/dashboard-order-stats";
import { DashboardStatCards } from "@/app/dashboard/_components/dashboard-stat-cards";
import { DashboardRecentOrders } from "@/app/dashboard/_components/dashboard-recent-orders";

function formatMoney(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function DisplayOrdersView({
  ordersByStatus,
  totalOrders,
  paidOrders,
}: {
  ordersByStatus: Record<string, number>;
  totalOrders: number;
  paidOrders: number;
}) {
  return (
    <div className="h-full overflow-auto rounded-lg border bg-card p-4">
      <DashboardOrderStats
        ordersByStatus={ordersByStatus}
        totalOrders={totalOrders}
        paidOrders={paidOrders}
      />
    </div>
  );
}

export function DisplayStatsView({ stats }: { stats: DashboardStats }) {
  return (
    <div className="h-full overflow-auto rounded-lg border bg-card p-4">
      <DashboardStatCards stats={stats} />
    </div>
  );
}

export function DisplayRevenueView({ revenueByDay }: { revenueByDay: RevenueByDayItem[] }) {
  const data = revenueByDay.map((d) => ({
    ...d,
    dateShort: d.date.slice(5),
    revenue: Math.round(d.revenue),
  }));
  return (
    <div className="h-full flex flex-col rounded-lg border bg-card p-4">
      <h3 className="mb-2 font-semibold">รายได้รายวัน (7 วันล่าสุด)</h3>
      <div className="min-h-[200px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="dispRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="dateShort" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v} ฿`} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fill="url(#dispRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function DisplayTopView({ topProducts }: { topProducts: TopProductItem[] }) {
  const data = topProducts.map((p) => ({
    name: p.name.length > 14 ? p.name.slice(0, 14) + "…" : p.name,
    ชิ้น: p.quantity,
    รายได้: p.revenue,
  }));
  return (
    <div className="h-full flex flex-col rounded-lg border bg-card p-4">
      <h3 className="mb-2 font-semibold">สินค้าขายดี</h3>
      <div className="min-h-[200px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
            <Bar dataKey="ชิ้น" fill="var(--chart-3)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function DisplayRecentView({ orders }: { orders: RecentOrderItem[] }) {
  return (
    <div className="h-full overflow-auto rounded-lg border bg-card p-4">
      <DashboardRecentOrders orders={orders} />
    </div>
  );
}
