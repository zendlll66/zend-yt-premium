import Link from "next/link";
import { findAllCustomers } from "@/features/customer/customer.repo";
import { Button } from "@/components/ui/button";
import { InventoryOrderAddForm } from "./inventory-order-add-form";

export default async function AddInventoryOrderPage() {
  const customers = await findAllCustomers(500);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/inventory/orders/active">← Inventory Orders</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">เพิ่ม Inventory Order (Add Order ให้ลูกค้า)</h1>
      <p className="text-sm text-muted-foreground">
        สร้างคำสั่งซื้อแบบ paid และรายการ inventory พร้อมกำหนดวันเริ่ม–หมดอายุได้ตั้งแต่ตอนเพิ่ม
      </p>
      <InventoryOrderAddForm customers={customers} />
    </div>
  );
}
