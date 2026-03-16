import { Suspense } from "react";
import { findAllCustomers } from "@/features/customer/customer.repo";
import { getMenuForOrder } from "@/features/modifier/modifier.repo";
import { AddOrderClient } from "./add-order-client";

export const dynamic = "force-dynamic";

export default async function AddOrderPage() {
  const [customers, menu] = await Promise.all([
    findAllCustomers(500),
    getMenuForOrder(),
  ]);

  return (
    <div className="container max-w-4xl py-6">
      <h1 className="mb-6 text-2xl font-semibold">สร้างคำสั่งให้ลูกค้า</h1>
      <Suspense fallback={<p className="text-muted-foreground">กำลังโหลด…</p>}>
        <AddOrderClient customers={customers} menu={menu} />
      </Suspense>
    </div>
  );
}
