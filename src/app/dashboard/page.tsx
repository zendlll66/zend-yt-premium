import Link from "next/link";
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
import { Button } from "@/components/ui/button";
import { ReceiptText, Package, Settings, Tv } from "lucide-react";

const DAYS_LABEL = 7;

export default async function Page() {
  const [stats, revenueByDay, topProducts, recentOrders] = await Promise.all([
    getDashboardStats(),
    getRevenueByDay(DAYS_LABEL),
    getTopProducts(10),
    getRecentOrders(8),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">ภาพรวม</h1>
        <p className="text-muted-foreground text-sm">
          สรุปรายได้ ต้นทุน กำไร และสถิติบิลจากคำสั่งเช่าที่ชำระแล้ว · ข้อมูลกราฟใช้ช่วง {DAYS_LABEL} วันล่าสุด
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/orders">
            <ReceiptText className="mr-1.5 h-4 w-4" />
            รายการคำสั่งเช่า
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/products">
            <Package className="mr-1.5 h-4 w-4" />
            จัดการสินค้า
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/settings">
            <Settings className="mr-1.5 h-4 w-4" />
            ตั้งค่าร้าน
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/multi-display">
            <Tv className="mr-1.5 h-4 w-4" />
            จอแสดงผล (Multi-display)
          </Link>
        </Button>
      </div>

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
