import {
  getDashboardStats,
  getRevenueByDay,
  getTopProducts,
  getRecentOrders,
} from "@/features/dashboard/dashboard.repo";
import { DashboardStatCards } from "./_components/dashboard-stat-cards";
import { DashboardOrderStats } from "./_components/dashboard-order-stats";
import { DashboardCharts } from "./_components/dashboard-charts";
import { DashboardRecentOrders } from "./_components/dashboard-recent-orders";

export default async function Page() {
  const [stats, revenueByDay, topProducts, recentOrders] = await Promise.all([
    getDashboardStats(),
    getRevenueByDay(7),
    getTopProducts(10),
    getRecentOrders(8),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-xl font-semibold">ภาพรวม</h1>

      <DashboardStatCards
        stats={{
          revenue: stats.revenue,
          cost: stats.cost,
          profit: stats.profit,
          paidOrders: stats.paidOrders,
        }}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardOrderStats
            ordersByStatus={stats.ordersByStatus}
            totalOrders={stats.totalOrders}
            paidOrders={stats.paidOrders}
          />
        </div>
        <DashboardRecentOrders orders={recentOrders} />
      </div>

      <DashboardCharts
        revenueByDay={revenueByDay}
        ordersByStatus={stats.ordersByStatus}
        topProducts={topProducts}
      />
    </div>
  );
}
