/**
 * รันครั้งเดียวหลัง apply migration 0007: สร้าง kitchen_orders จาก orders เดิม
 * และใส่ kitchen_order_id ให้ order_items ที่ยังไม่มี
 *
 * รัน: npx tsx src/db/migrate-kitchen-orders.ts
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { orders, orderItems, kitchenOrders } from "./schema/order.schema";

async function migrate() {
  const allOrders = await db.select({ id: orders.id, status: orders.status }).from(orders);

  for (const ord of allOrders) {
    const existingKitchen = await db
      .select({ id: kitchenOrders.id })
      .from(kitchenOrders)
      .where(eq(kitchenOrders.orderId, ord.id))
      .limit(1);

    if (existingKitchen.length > 0) {
      console.log("Order", ord.id, "already has kitchen_orders, skip");
      continue;
    }

    const items = await db
      .select({ id: orderItems.id })
      .from(orderItems)
      .where(eq(orderItems.orderId, ord.id));

    if (items.length === 0) {
      const [ko] = await db
        .insert(kitchenOrders)
        .values({
          orderId: ord.id,
          status: mapBillStatusToKitchen(ord.status),
          sequence: 1,
        })
        .returning({ id: kitchenOrders.id });
      if (ko) console.log("Order", ord.id, "empty, created kitchen_order", ko.id);
      continue;
    }

    const [ko] = await db
      .insert(kitchenOrders)
      .values({
        orderId: ord.id,
        status: mapBillStatusToKitchen(ord.status),
        sequence: 1,
      })
      .returning({ id: kitchenOrders.id });

    if (!ko) continue;

    for (const it of items) {
      await db
        .update(orderItems)
        .set({ kitchenOrderId: ko.id })
        .where(eq(orderItems.id, it.id));
    }
    console.log("Order", ord.id, "→ kitchen_order", ko.id, "items:", items.length);
  }

  console.log("Migrate kitchen_orders done.");
}

function mapBillStatusToKitchen(
  s: string
): "pending" | "preparing" | "ready" | "served" {
  if (s === "preparing") return "preparing";
  if (s === "ready") return "ready";
  if (s === "served" || s === "paid" || s === "cancelled") return "served";
  return "pending";
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
