import { findOrdersForDashboard } from "@/features/order/order.repo";
import { OrdersTableClient } from "./orders-table-client";

export default async function OrdersPage() {
  const orders = await findOrdersForDashboard();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">รายการคำสั่งซื้อ</h1>
      </div>

      <OrdersTableClient orders={orders} />
    </div>
  );
}
