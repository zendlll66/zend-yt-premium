"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "รอจัดเตรียม",
  preparing: "กำลังจัดเตรียม",
  ready: "พร้อมเสิร์ฟ",
  served: "จัดเสิร์ฟแล้ว",
  paid: "ชำระแล้ว",
  cancelled: "ยกเลิก",
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(d: string | Date | null) {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

type RecentOrderItem = {
  id: number;
  orderNumber: string;
  status: string;
  totalPrice: number;
  createdAt: string | Date | null;
};

export function DashboardRecentOrders({ orders }: { orders: RecentOrderItem[] }) {
  return (
    <motion.div
      className="rounded-xl border bg-card p-4 shadow-sm"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">บิลล่าสุด</h3>
        <Link
          href="/dashboard/orders"
          className="text-primary text-sm underline-offset-4 hover:underline"
        >
          ดูทั้งหมด
        </Link>
      </div>
      <ul className="space-y-2">
        {orders.length === 0 ? (
          <li className="py-4 text-center text-muted-foreground text-sm">ยังไม่มีบิล</li>
        ) : (
          orders.map((order, i) => (
            <motion.li
              key={order.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.05 }}
            >
              <Link
                href={`/dashboard/orders/${order.id}`}
                className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/60"
              >
                <div className="min-w-0">
                  <p className="font-medium tabular-nums">{order.orderNumber}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatDate(order.createdAt)} · {ORDER_STATUS_LABELS[order.status] ?? order.status}
                  </p>
                </div>
                <p className="ml-2 shrink-0 font-semibold tabular-nums">
                  {formatMoney(order.totalPrice)}
                </p>
              </Link>
            </motion.li>
          ))
        )}
      </ul>
    </motion.div>
  );
}
