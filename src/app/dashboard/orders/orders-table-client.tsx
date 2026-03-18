"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateOrderStatusAction } from "@/features/order/order.actions";
import type { DashboardOrderListItem } from "@/features/order/order.repo";

const STATUS_LABELS: Record<string, string> = {
  pending: "รอชำระเงิน",
  wait: "รอตรวจสอบสลิป",
  paid: "ชำระแล้ว",
  fulfilled: "จัดส่งสำเร็จ",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
  refunded: "คืนเงิน",
};

const CUSTOMER_ACCOUNT_STAGE_LABELS: Record<string, string> = {
  pending: "รอดำเนินการ",
  processing: "กำลังดำเนินการ",
  subscribed: "สมัครใช้งานแล้ว",
};

function formatMoney(n: number) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function getProductTypeLabel(productType: string) {
  if (productType === "individual") return "Individual";
  if (productType === "family") return "Family";
  if (productType === "invite") return "Invite Link";
  if (productType === "customer_account") return "Customer Account";
  return productType;
}

function getCustomerAccountStageBadge(stage: string) {
  const s = stage.trim();
  // stage ที่มาจาก repo ตอนนี้อาจเป็น "รอดำเนินการ" / "กำลังดำเนินการ" / "subscribed"
  if (s === "รอดำเนินการ") {
    return {
      label: CUSTOMER_ACCOUNT_STAGE_LABELS.pending,
      className:
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium border-amber-200 bg-amber-50 text-amber-700",
    };
  }
  if (s === "กำลังดำเนินการ") {
    return {
      label: CUSTOMER_ACCOUNT_STAGE_LABELS.processing,
      className:
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium border-blue-200 bg-blue-50 text-blue-700",
    };
  }
  if (s.toLowerCase() === "subscribed") {
    return {
      label: CUSTOMER_ACCOUNT_STAGE_LABELS.subscribed,
      className:
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }
  return {
    label: s,
    className:
      "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium border-neutral-200 bg-neutral-50 text-neutral-700",
  };
}

type Props = {
  orders: DashboardOrderListItem[];
};

export function OrdersTableClient({ orders }: Props) {
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [selectedProductType, setSelectedProductType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCustomerAccountStage, setSelectedCustomerAccountStage] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  async function handleApprove(orderId: number) {
    await updateOrderStatusAction(orderId, "paid");
    router.refresh();
  }

  const productOptions = useMemo(() => {
    const names = new Set<string>();
    for (const order of orders) {
      for (const item of order.items) names.add(item.productName);
    }
    return ["all", ...Array.from(names).sort((a, b) => a.localeCompare(b, "th"))];
  }, [orders]);

  const productTypeOptions = useMemo(() => {
    const types = new Set<string>();
    for (const order of orders) types.add(order.productType);
    return ["all", ...Array.from(types)];
  }, [orders]);

  const statusOptions = useMemo(() => {
    const statuses = new Set<string>();
    for (const order of orders) statuses.add(order.status);
    return ["all", ...Array.from(statuses)];
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      const passProduct =
        selectedProduct === "all" ||
        order.items.some((item) => item.productName === selectedProduct);
      const passProductType =
        selectedProductType === "all" || order.productType === selectedProductType;
      const passStatus = selectedStatus === "all" || order.status === selectedStatus;
      const passCustomerAccountStage =
        selectedCustomerAccountStage === "all" || order.customerAccountStageLabel === selectedCustomerAccountStage;

      const orderNumber = String(order.orderNumber ?? "");
      const passSearch =
        !q ||
        orderNumber.toLowerCase().includes(q) ||
        (order.customerName ?? "").toLowerCase().includes(q) ||
        (order.customerEmail ?? "").toLowerCase().includes(q);

      return passProduct && passProductType && passStatus && passCustomerAccountStage && passSearch;
    });
  }, [orders, selectedProduct, selectedProductType, selectedStatus, selectedCustomerAccountStage, search]);

  return (
    <div className="space-y-3">
      <div className="grid gap-2 rounded-xl border bg-card p-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">สินค้า</label>
          <select
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
          >
            {productOptions.map((name) => (
              <option key={name} value={name}>
                {name === "all" ? "ทั้งหมด" : name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">ประเภทสินค้า</label>
          <select
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={selectedProductType}
            onChange={(e) => setSelectedProductType(e.target.value)}
          >
            {productTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type === "all" ? "ทั้งหมด" : getProductTypeLabel(type)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">สถานะ</label>
          <select
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === "all" ? "ทั้งหมด" : (STATUS_LABELS[status] ?? status)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-2 rounded-xl border bg-card p-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Customer Account Workflow</label>
          <select
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={selectedCustomerAccountStage}
            onChange={(e) => setSelectedCustomerAccountStage(e.target.value)}
          >
            <option value="all">ทั้งหมด</option>
            <option value="รอดำเนินการ">รอดำเนินการ</option>
            <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
            <option value="subscribed">สมัครใช้งานแล้ว</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">ค้นหา (เลขที่/ชื่อ)</label>
          <input
            type="search"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            placeholder="เช่น 10012 หรือ Somchai"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 font-medium">เลขที่</th>
                <th className="px-4 py-3 font-medium">ลูกค้าที่ใช้</th>
                <th className="px-4 py-3 font-medium">สินค้า</th>
                <th className="px-4 py-3 font-medium">ประเภทสินค้า</th>
                <th className="px-4 py-3 font-medium">สถานะ</th>
                <th className="px-4 py-3 font-medium">สลิป</th>
                <th className="px-4 py-3 font-medium">ยอดรวม</th>
                <th className="px-4 py-3 text-right font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    ไม่พบรายการตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-mono text-sm">{o.orderNumber}</td>
                    <td className="px-4 py-3">
                      {o.customerIdResolved ? (
                        <Link
                          href={`/dashboard/customers/${o.customerIdResolved}`}
                          className="inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs hover:bg-muted"
                        >
                          {o.customerLinePictureUrl ? (
                            <img
                              src={o.customerLinePictureUrl.startsWith("http") ? o.customerLinePictureUrl : `/api/r2-url?key=${encodeURIComponent(o.customerLinePictureUrl)}`}
                              alt=""
                              className="h-6 w-6 rounded-full object-cover"
                            />
                          ) : (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px]">
                              U
                            </span>
                          )}
                          <span className="max-w-[180px] truncate">
                            {o.customerLineDisplayName ?? o.customerName}
                          </span>
                          {(o.customerLineDisplayName ?? o.customerLinePictureUrl) && (
                            <span className="shrink-0 rounded bg-[#06C755]/15 px-1.5 py-0.5 text-[10px] font-medium text-[#06C755]">
                              LINE
                            </span>
                          )}
                        </Link>
                      ) : (
                        <span className="font-medium">{o.customerName}</span>
                      )}
                      <span className="mt-1 block text-xs text-muted-foreground">{o.customerEmail}</span>
                    </td>
                    <td className="px-4 py-3">
                      {o.items.length > 0 ? (
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          {o.items.slice(0, 3).map((item, idx) => (
                            <li key={`${o.id}-item-${idx}`}>
                              {item.productName} x{item.quantity}
                            </li>
                          ))}
                          {o.items.length > 3 && <li>... และอีก {o.items.length - 3} รายการ</li>}
                        </ul>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {getProductTypeLabel(o.productType)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span
                          className={
                            o.status === "cancelled"
                              ? "text-muted-foreground"
                              : o.status === "paid" || o.status === "completed"
                                ? "text-green-600 dark:text-green-400"
                                : "text-amber-600 dark:text-amber-400"
                          }
                        >
                          {STATUS_LABELS[o.status] ?? o.status}
                        </span>
                        {o.productType === "customer_account" && o.customerAccountStageLabel && (
                          <span className={getCustomerAccountStageBadge(o.customerAccountStageLabel).className}>
                            Customer Account:{" "}
                            <span className="font-medium">
                              {getCustomerAccountStageBadge(o.customerAccountStageLabel).label}
                            </span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {o.paymentSlipImageUrl ? (
                        <a
                          href={`/api/r2-url?key=${encodeURIComponent(o.paymentSlipImageUrl)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block"
                        >
                          <img
                            src={`/api/r2-url?key=${encodeURIComponent(o.paymentSlipImageUrl)}`}
                            alt="สลิป"
                            className="h-12 w-12 rounded border object-cover"
                          />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{formatMoney(o.totalPrice)} ฿</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {o.status === "wait" && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApprove(o.id)}
                          >
                            Approve
                          </Button>
                        )}
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/orders/${o.id}`}>รายละเอียด</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/orders/${o.id}/edit`}>แก้ไข</Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

