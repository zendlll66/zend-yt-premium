import Link from "next/link";
import { findOrdersForDashboard } from "@/features/order/order.repo";
import { OrdersTableClient } from "./orders-table-client";
import { Button } from "@/components/ui/button";

export default async function OrdersPage() {
  const orders = await findOrdersForDashboard();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">รายการคำสั่งซื้อ</h1>
        <Button asChild>
          <Link href="/dashboard/orders/add">สร้างคำสั่งให้ลูกค้า</Link>
        </Button>
      </div>

      <OrdersTableClient orders={orders} />
    </div>
  );
}
