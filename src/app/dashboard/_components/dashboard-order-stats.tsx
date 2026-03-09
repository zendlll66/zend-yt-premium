"use client";

import { motion } from "framer-motion";

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "รอจัดเตรียม",
  preparing: "กำลังจัดเตรียม",
  ready: "พร้อมเสิร์ฟ",
  served: "จัดเสิร์ฟแล้ว",
  paid: "ชำระแล้ว",
  cancelled: "ยกเลิก",
};

const STATUS_ORDER = ["pending", "preparing", "ready", "served", "paid", "cancelled"] as const;

type Props = {
  ordersByStatus: Record<string, number>;
  totalOrders: number;
  paidOrders: number;
};

export function DashboardOrderStats({ ordersByStatus, totalOrders, paidOrders }: Props) {
  return (
    <motion.div
      className="rounded-xl border bg-card p-4 shadow-sm"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
    >
      <h2 className="mb-4 font-semibold">สถิติบิล</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <motion.div
          className="rounded-lg bg-muted/50 p-3"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <p className="text-muted-foreground text-sm">บิลทั้งหมด</p>
          <p className="text-xl font-semibold tabular-nums">{totalOrders}</p>
        </motion.div>
        <motion.div
          className="rounded-lg bg-muted/50 p-3"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <p className="text-muted-foreground text-sm">บิลที่ชำระแล้ว</p>
          <p className="text-xl font-semibold tabular-nums text-green-600 dark:text-green-400">
            {paidOrders}
          </p>
        </motion.div>
        <div className="sm:col-span-2 lg:col-span-1" />
        {STATUS_ORDER.map((status, i) => (
          <motion.div
            key={status}
            className="rounded-lg bg-muted/50 p-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.03 }}
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-muted-foreground text-sm">
              {ORDER_STATUS_LABELS[status] ?? status}
            </p>
            <p className="text-lg font-semibold tabular-nums">
              {ordersByStatus[status] ?? 0}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
