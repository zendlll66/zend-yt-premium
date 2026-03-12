import Link from "next/link";
import {
  getDashboardStats,
  getRevenueByDay,
  getTopProducts,
  getRecentOrders,
} from "@/features/dashboard/dashboard.repo";
import { findProductsLowStock } from "@/features/product/product.repo";
import { DashboardStatCards } from "./_components/dashboard-stat-cards";
import { DashboardOrderStats } from "./_components/dashboard-order-stats";
import { DashboardCharts } from "./_components/dashboard-charts";
import { DashboardRecentOrders } from "./_components/dashboard-recent-orders";
import { DashboardDateFilter } from "./_components/dashboard-date-filter";
import { DashboardLowStockAlert } from "./_components/dashboard-low-stock-alert";
import { Button } from "@/components/ui/button";
import { ReceiptText, Package, Settings, Tv, FileDown } from "lucide-react";

const DAYS_LABEL = 7;

type PageProps = { searchParams: Promise<{ from?: string; to?: string }> };

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const fromParam = params.from ? new Date(params.from) : null;
  const toParam = params.to ? new Date(params.to) : null;
  const hasDateFilter = fromParam != null || toParam != null;
  const dayCount = hasDateFilter && fromParam && toParam
    ? Math.max(1, Math.ceil((toParam.getTime() - fromParam.getTime()) / (24 * 60 * 60 * 1000)) + 1)
    : DAYS_LABEL;

  const [stats, revenueByDay, topProducts, recentOrders, lowStockProducts] = await Promise.all([
    getDashboardStats(fromParam ?? undefined, toParam ?? undefined),
    getRevenueByDay(dayCount, fromParam ?? undefined, toParam ?? undefined),
    getTopProducts(10),
    getRecentOrders(8),
    findProductsLowStock(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">ภาพรวม</h1>
        <p className="text-muted-foreground text-sm">
          สรุปรายได้ ต้นทุน กำไร และสถิติบิลจากคำสั่งเช่าที่ชำระแล้ว
          {hasDateFilter ? " · กรองตามช่วงวันที่ที่เลือก" : ` · ข้อมูลกราฟใช้ช่วง ${DAYS_LABEL} วันล่าสุด`}
        </p>
      </div>

      <DashboardDateFilter defaultFrom={params.from} defaultTo={params.to} />

      <DashboardLowStockAlert products={lowStockProducts} />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/reports">
            <FileDown className="mr-1.5 h-4 w-4" />
            Export รายงาน
          </Link>
        </Button>
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
