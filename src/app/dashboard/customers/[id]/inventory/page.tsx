import Link from "next/link";
import { notFound } from "next/navigation";
import { findCustomerById } from "@/features/customer/customer.repo";
import { findInventoryByCustomerId } from "@/features/inventory/inventory-order.repo";
import { deleteInventoryOrderAction } from "@/features/inventory/inventory-order.actions";
import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { AddInventoryForm } from "./add-inventory-form";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await findCustomerById(parseInt(id, 10));
  return { title: `Inventory ของ ${customer?.name ?? "ลูกค้า"} | แดชบอร์ด` };
}

function getInventoryStatus(expiresAt: Date | null): {
  label: string;
  cls: string;
} {
  if (!expiresAt) return { label: "ไม่มีวันหมดอายุ", cls: "bg-muted text-muted-foreground" };
  const now = new Date();
  const diffMs = expiresAt.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return { label: "หมดอายุแล้ว", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" };
  if (diffDays <= 7) return { label: `เหลือ ${Math.ceil(diffDays)} วัน`, cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" };
  return { label: `เหลือ ${Math.ceil(diffDays)} วัน`, cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" };
}

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const ITEM_TYPE_LABELS: Record<string, string> = {
  individual: "Individual",
  family: "Family",
  invite: "Invite",
  customer_account: "Customer Acct",
};

export default async function CustomerInventoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customerId = parseInt(id, 10);
  if (!Number.isFinite(customerId)) notFound();

  const [customer, inventoryList] = await Promise.all([
    findCustomerById(customerId),
    findInventoryByCustomerId(customerId),
  ]);
  if (!customer) notFound();

  const active = inventoryList.filter(
    (i) => i.expiresAt && new Date(i.expiresAt).getTime() > Date.now()
  ).length;
  const expired = inventoryList.filter(
    (i) => i.expiresAt && new Date(i.expiresAt).getTime() <= Date.now()
  ).length;
  const noDate = inventoryList.filter((i) => !i.expiresAt).length;

  const backUrl = `/dashboard/customers/${customerId}/inventory`;

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/customers">← รายการลูกค้า</Link>
            </Button>
          </div>
          <h1 className="text-xl font-semibold">{customer.name}</h1>
          <p className="text-sm text-muted-foreground">{customer.email}</p>
        </div>
        <AddInventoryForm customerId={customerId} customerName={customer.name} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 max-w-md">
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{active}</p>
          <p className="text-xs text-muted-foreground mt-0.5">ใช้งานได้</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{expired}</p>
          <p className="text-xs text-muted-foreground mt-0.5">หมดอายุ</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{inventoryList.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">ทั้งหมด</p>
        </div>
      </div>

      {/* Inventory list */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground font-mono text-xs">Order ID</th>
                <th className="px-4 py-3 text-left font-medium">Order #</th>
                <th className="px-4 py-3 text-left font-medium">ประเภท</th>
                <th className="px-4 py-3 text-left font-medium">รายการ</th>
                <th className="px-4 py-3 text-left font-medium">อีเมล/รหัส</th>
                <th className="px-4 py-3 text-left font-medium">วันเริ่ม</th>
                <th className="px-4 py-3 text-left font-medium">วันหมด</th>
                <th className="px-4 py-3 text-left font-medium">สถานะ</th>
                <th className="px-4 py-3 text-left font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {inventoryList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                    ยังไม่มี Inventory — กด "เพิ่ม Inventory ใหม่" ด้านบน
                  </td>
                </tr>
              ) : (
                inventoryList.map((inv) => {
                  const status = getInventoryStatus(inv.expiresAt);
                  return (
                    <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground select-all whitespace-nowrap">
                        {inv.orderId ?? inv.id}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {inv.orderNumber ? (
                          <span title={`Order #${inv.orderNumber}`}>
                            {inv.orderNumber.length > 12
                              ? `…${inv.orderNumber.slice(-8)}`
                              : inv.orderNumber}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap">
                          {ITEM_TYPE_LABELS[inv.itemType] ?? inv.itemType}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <p className="truncate font-medium">{inv.title}</p>
                        {inv.note && (
                          <p className="truncate text-xs text-muted-foreground">{inv.note}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-[140px]">
                        <p className="truncate">{inv.loginEmail ?? "—"}</p>
                        {inv.inviteLink && (
                          <a
                            href={inv.inviteLink}
                            target="_blank"
                            rel="noreferrer"
                            className="truncate text-primary underline underline-offset-2 block"
                          >
                            invite link
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                        {formatDate(inv.activatedAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                        {formatDate(inv.expiresAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${status.cls}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <Link
                            href={`/dashboard/inventory/orders/${inv.id}/edit`}
                            className="text-xs text-primary underline underline-offset-2"
                          >
                            แก้ไข
                          </Link>
                          <form action={deleteInventoryOrderAction}>
                            <input type="hidden" name="id" value={inv.id} />
                            <input type="hidden" name="redirectTo" value={backUrl} />
                            <FormSubmitButton
                              variant="ghost"
                              size="sm"
                              loadingText="ลบ…"
                              className="h-auto px-1 py-0 text-xs text-destructive hover:bg-destructive/10"
                            >
                              ลบ
                            </FormSubmitButton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
