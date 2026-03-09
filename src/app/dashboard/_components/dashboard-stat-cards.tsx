"use client";

import { motion } from "framer-motion";

type Stats = {
  revenue: number;
  cost: number;
  profit: number;
  paidOrders: number;
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const cards: { key: keyof Stats; label: string; sub: string; color: string }[] = [
  {
    key: "revenue",
    label: "รายได้",
    sub: "ยอดขายที่ชำระแล้ว",
    color: "text-green-600 dark:text-green-400",
  },
  {
    key: "cost",
    label: "ต้นทุน",
    sub: "ต้นทุนจากบิลที่ชำระแล้ว",
    color: "text-amber-600 dark:text-amber-400",
  },
  {
    key: "profit",
    label: "กำไร",
    sub: "รายได้ − ต้นทุน",
    color: "",
  },
  {
    key: "paidOrders",
    label: "กำไร + ต้นทุน",
    sub: "เท่ากับรายได้",
    color: "",
  },
];

function getValue(stats: Stats, key: keyof Stats): string {
  if (key === "paidOrders") return String(stats.revenue); // กำไร+ต้นทุน = รายได้
  const v = stats[key];
  return typeof v === "number" ? formatMoney(v) : String(v);
}

function getProfitColor(profit: number) {
  return profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400";
}

export function DashboardStatCards({ stats }: { stats: Stats }) {
  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {cards.map(({ key, label, sub, color }) => (
        <motion.div
          key={key}
          variants={item}
          className="rounded-xl border bg-card p-4 shadow-sm"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <p className="text-muted-foreground text-sm">{label}</p>
          <p
            className={`mt-1 text-2xl font-semibold tabular-nums ${
              key === "profit" ? getProfitColor(stats.profit) : color
            }`}
          >
            {key === "paidOrders" ? formatMoney(stats.revenue) : getValue(stats, key)}
          </p>
          <p className="mt-0.5 text-muted-foreground text-xs">{sub}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
