import Link from "next/link";
import { notFound } from "next/navigation";
import { findAllCustomers } from "@/features/customer/customer.repo";
import { findAccountStockById } from "@/features/youtube/youtube-stock.repo";
import { findCustomerInventoryForOrderItem } from "@/features/inventory/customer-inventory.repo";
import { Button } from "@/components/ui/button";
import { EditAccountStockForm } from "./edit-account-stock-form";

export default async function EditAccountStockPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const stockId = parseInt(id, 10);
  if (!Number.isFinite(stockId)) notFound();

  const [stock, customers] = await Promise.all([
    findAccountStockById(stockId),
    findAllCustomers(500),
  ]);
  if (!stock) notFound();

  const inventoryRow =
    stock.orderId != null
      ? await findCustomerInventoryForOrderItem({
          orderId: stock.orderId,
          itemType: "individual",
          loginEmail: stock.email,
        })
      : null;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/stocks/account-stock">← Individual Account Stock</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">แก้ไข Account Stock #{stock.id}</h1>

      <EditAccountStockForm
        stock={{
          id: stock.id,
          email: stock.email,
          password: stock.password,
          status: stock.status,
          orderId: stock.orderId ?? null,
          customerId: stock.customerId ?? null,
          soldAt: stock.soldAt ? stock.soldAt.toISOString() : null,
          updatedAt: stock.updatedAt ? stock.updatedAt.toISOString() : null,
        }}
        inventory={
          inventoryRow
            ? {
                id: inventoryRow.id,
                activatedAt: inventoryRow.activatedAt ? inventoryRow.activatedAt.toISOString() : null,
                expiresAt: inventoryRow.expiresAt ? inventoryRow.expiresAt.toISOString() : null,
                note: inventoryRow.note ?? null,
              }
            : null
        }
        customers={customers}
      />
    </div>
  );
}
