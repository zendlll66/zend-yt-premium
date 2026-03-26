import Link from "next/link";
import { Button } from "@/components/ui/button";
import { findAllCustomers } from "@/features/customer/customer.repo";
import { AddAccountStockForm } from "./add-account-stock-form";

export default async function AddAccountStockPage() {
  const customers = await findAllCustomers(500);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/stocks/account-stock">← Individual Account Stock</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">เพิ่ม Account Stock</h1>
      <AddAccountStockForm customers={customers} />
    </div>
  );
}
