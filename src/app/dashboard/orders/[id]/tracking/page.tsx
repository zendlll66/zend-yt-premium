import Link from "next/link";
import { notFound } from "next/navigation";
import { findOrderById } from "@/features/order/order.repo";
import { Button } from "@/components/ui/button";
import { FulfillmentStepper } from "./fulfillment-stepper";
import { MapPin, Store } from "lucide-react";

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orderId = parseInt(id, 10);
  if (!Number.isFinite(orderId)) notFound();

  const order = await findOrderById(orderId);
  if (!order) notFound();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/orders">← รายการคำสั่ง</Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/orders/${orderId}`}>รายละเอียดคำสั่ง</Link>
        </Button>
      </div>

      <div>
        <h1 className="text-xl font-semibold">ติดตามการส่ง</h1>
        <p className="font-mono text-muted-foreground">
          {order.orderNumber} · {order.customerName}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          เปลี่ยนสถานะการจัดส่งของแต่ละรายการได้ตรงหน้านี้ — กดที่วงกลมในเส้นขั้นตอน หรือเลือกจาก dropdown ใต้แต่ละรายการ
        </p>
      </div>

      <div className="space-y-6">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border bg-card p-5 shadow-sm"
          >
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{item.productName}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDate(item.rentalStart)} – {formatDate(item.rentalEnd)}
                  {item.deliveryOption && (
                    <span className="ml-2 inline-flex items-center gap-1">
                      {item.deliveryOption === "pickup" ? (
                        <>
                          <Store className="h-3.5 w-3.5" />
                          รับที่ร้าน
                        </>
                      ) : (
                        <>
                          <MapPin className="h-3.5 w-3.5" />
                          ส่ง
                        </>
                      )}
                    </span>
                  )}
                </p>
                {item.modifiers.length > 0 && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.modifiers.map((m) => m.modifierName).join(", ")}
                  </p>
                )}
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                จำนวน {item.quantity}
              </span>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="mb-3 text-sm font-medium text-foreground">
                สถานะการจัดส่ง — เปลี่ยนสถานะได้ตรงนี้เลย (กดที่วงกลมหรือเลือกจากรายการ)
              </p>
              <FulfillmentStepper
                orderItemId={item.id}
                orderId={order.id}
                currentStatus={item.fulfillmentStatus}
                showDropdown
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
