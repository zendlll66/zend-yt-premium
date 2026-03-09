"use client";

import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { RevenueByDayItem } from "@/features/dashboard/dashboard.repo";
import type { TopProductItem } from "@/features/dashboard/dashboard.repo";

const chartVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4 },
  }),
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "รอจัดเตรียม",
  preparing: "กำลังจัดเตรียม",
  ready: "พร้อมเสิร์ฟ",
  served: "จัดเสิร์ฟแล้ว",
  paid: "ชำระแล้ว",
  cancelled: "ยกเลิก",
};

type OrdersByStatus = Record<string, number>;

type Props = {
  revenueByDay: RevenueByDayItem[];
  ordersByStatus: OrdersByStatus;
  topProducts: TopProductItem[];
};

export function DashboardCharts({ revenueByDay, ordersByStatus, topProducts }: Props) {
  const statusChartData = Object.entries(ordersByStatus).map(([status, count]) => ({
    name: ORDER_STATUS_LABELS[status] ?? status,
    จำนวนบิล: count,
    status,
  }));

  const topProductsChartData = topProducts.map((p) => ({
    name: p.name.length > 12 ? p.name.slice(0, 12) + "…" : p.name,
    ชิ้น: p.quantity,
    รายได้: p.revenue,
  }));

  const revenueByDayFormatted = revenueByDay.map((d) => ({
    ...d,
    dateShort: d.date.slice(5),
    revenue: Math.round(d.revenue),
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* รายได้รายวัน */}
      <motion.div
        className="rounded-xl border bg-card p-4 shadow-sm"
        custom={0}
        initial="hidden"
        animate="visible"
        variants={chartVariants}
      >
        <h3 className="mb-4 font-semibold">รายได้รายวัน (7 วันล่าสุด)</h3>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueByDayFormatted} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="dateShort" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v} ฿`} />
              <Tooltip
                formatter={(value) => [formatMoney(Number(value ?? 0)), "รายได้"]}
                labelFormatter={(label) => `วันที่ ${label}`}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* จำนวนบิลแยกตามสถานะ */}
      <motion.div
        className="rounded-xl border bg-card p-4 shadow-sm"
        custom={1}
        initial="hidden"
        animate="visible"
        variants={chartVariants}
      >
        <h3 className="mb-4 font-semibold">จำนวนบิลแยกตามสถานะ</h3>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="จำนวนบิล" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* สินค้าขายดี */}
      <motion.div
        className="rounded-xl border bg-card p-4 shadow-sm lg:col-span-2"
        custom={2}
        initial="hidden"
        animate="visible"
        variants={chartVariants}
      >
        <h3 className="mb-4 font-semibold">สินค้าขายดี (จากบิลที่ชำระแล้ว)</h3>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topProductsChartData}
              layout="vertical"
              margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value, name) =>
                  name === "รายได้" ? [formatMoney(Number(value ?? 0)), name] : [value ?? 0, name]
                }
              />
              <Legend />
              <Bar dataKey="ชิ้น" fill="var(--chart-3)" radius={[0, 4, 4, 0]} name="จำนวน (ชิ้น)" />
              <Bar dataKey="รายได้" fill="var(--chart-4)" radius={[0, 4, 4, 0]} name="รายได้ (฿)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
