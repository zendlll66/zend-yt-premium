import { desc, eq, sql, sum } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, kitchenOrders } from "@/db/schema/order.schema";
import { products } from "@/db/schema/product.schema";

export type DashboardStats = {
  /** รายได้ (ยอดขายที่ชำระแล้ว) */
  revenue: number;
  /** ต้นทุน (จากบิลที่ชำระแล้ว) */
  cost: number;
  /** กำไร = รายได้ - ต้นทุน */
  profit: number;
  /** จำนวนบิลแยกตามสถานะ */
  ordersByStatus: Record<string, number>;
  /** จำนวนบิลทั้งหมด */
  totalOrders: number;
  /** จำนวนบิลที่ชำระแล้ว */
  paidOrders: number;
};

/** รายได้ต่อวัน (สำหรับกราฟ) */
export type RevenueByDayItem = { date: string; revenue: number; orders: number };

/** สินค้าขายดี */
export type TopProductItem = { name: string; quantity: number; revenue: number };

/** บิลล่าสุด */
export type RecentOrderItem = {
  id: number;
  orderNumber: string;
  status: string;
  totalPrice: number;
  createdAt: Date | null;
};

const PAID_STATUS = "paid";

export async function getDashboardStats(): Promise<DashboardStats> {
  const [revenueRow] = await db
    .select({
      value: sum(orders.totalPrice),
    })
    .from(orders)
    .where(eq(orders.status, PAID_STATUS));

  const revenue = Number(revenueRow?.value ?? 0);

  const [costRow] = await db
    .select({
      value: sql<number>`coalesce(sum(${orderItems.quantity} * coalesce(${products.cost}, 0)), 0)`,
    })
    .from(orderItems)
    .leftJoin(kitchenOrders, eq(orderItems.kitchenOrderId, kitchenOrders.id))
    .innerJoin(orders, sql`${orders.id} = coalesce(${kitchenOrders.orderId}, ${orderItems.orderId})`)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orders.status, PAID_STATUS));

  const cost = Number(costRow?.value ?? 0);
  const profit = revenue - cost;

  const statusCounts = await db
    .select({
      status: orders.status,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(orders)
    .groupBy(orders.status);

  const ordersByStatus: Record<string, number> = {};
  let totalOrders = 0;
  for (const row of statusCounts) {
    ordersByStatus[row.status] = row.count;
    totalOrders += row.count;
  }

  const paidOrders = ordersByStatus[PAID_STATUS] ?? 0;

  return {
    revenue,
    cost,
    profit,
    ordersByStatus,
    totalOrders,
    paidOrders,
  };
}

/** รายได้และจำนวนบิลแยกตามวัน (ย้อนหลัง N วัน, เฉพาะบิลชำระแล้ว) */
export async function getRevenueByDay(dayCount: number): Promise<RevenueByDayItem[]> {
  const rows = await db
    .select({
      totalPrice: orders.totalPrice,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.status, PAID_STATUS));

  const byDay: Record<string, { revenue: number; orders: number }> = {};
  const today = new Date();
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    byDay[key] = { revenue: 0, orders: 0 };
  }

  for (const r of rows) {
    const date = r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : null;
    if (date && byDay[date]) {
      byDay[date].revenue += Number(r.totalPrice);
      byDay[date].orders += 1;
    }
  }

  return Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { revenue, orders }]) => ({ date, revenue, orders }));
}

/** สินค้าขายดีจากบิลที่ชำระแล้ว */
export async function getTopProducts(limit: number): Promise<TopProductItem[]> {
  const rows = await db
    .select({
      productName: orderItems.productName,
      quantity: orderItems.quantity,
      totalPrice: orderItems.totalPrice,
    })
    .from(orderItems)
    .leftJoin(kitchenOrders, eq(orderItems.kitchenOrderId, kitchenOrders.id))
    .innerJoin(orders, sql`${orders.id} = coalesce(${kitchenOrders.orderId}, ${orderItems.orderId})`)
    .where(eq(orders.status, PAID_STATUS));

  const byName: Record<string, { quantity: number; revenue: number }> = {};
  for (const r of rows) {
    const name = r.productName;
    if (!byName[name]) byName[name] = { quantity: 0, revenue: 0 };
    byName[name].quantity += r.quantity;
    byName[name].revenue += Number(r.totalPrice);
  }

  return Object.entries(byName)
    .map(([name, { quantity, revenue }]) => ({ name, quantity, revenue }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
}

/** บิลล่าสุด */
export async function getRecentOrders(limit: number): Promise<RecentOrderItem[]> {
  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      totalPrice: orders.totalPrice,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    orderNumber: r.orderNumber,
    status: r.status,
    totalPrice: Number(r.totalPrice),
    createdAt: r.createdAt,
  }));
}
