import { notFound } from "next/navigation";
import { findTableByQrToken } from "@/features/table/table.repo";
import { getTableOrder } from "@/features/order/order.repo";
import { getMenuForOrder } from "@/features/modifier/modifier.repo";
import { OrderClient } from "./order-client";

type Props = { params: Promise<{ token: string }> };

export default async function OrderPage({ params }: Props) {
  const { token } = await params;
  const table = await findTableByQrToken(token);
  if (!table) notFound();

  const [tableOrder, menu] = await Promise.all([
    getTableOrder(table.id),
    getMenuForOrder(),
  ]);

  return (
    <OrderClient
      tableId={table.id}
      tableNumber={table.tableNumber}
      initialOrder={tableOrder}
      menu={menu}
    />
  );
}
