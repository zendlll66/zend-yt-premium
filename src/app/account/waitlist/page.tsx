import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { getWaitlistByCustomer } from "@/features/waitlist/waitlist.repo";
import { LeaveWaitlistButton } from "./leave-waitlist-button";
import { Bell } from "lucide-react";

export default async function WaitlistPage() {
  const customer = await getCustomerSession();
  if (!customer) redirect("/customer-login?from=/account/waitlist");

  const waitlist = await getWaitlistByCustomer(customer.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <Bell className="h-5 w-5" />
          สินค้าที่รอ stock
        </h1>
        <p className="text-sm text-muted-foreground">เราจะแจ้งเตือนเมื่อมี stock ใหม่</p>
      </div>

      {waitlist.filter((w) => w.status === "waiting").length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          ไม่มีสินค้าที่รอ stock<br />
          <a href="/rent" className="mt-2 inline-block text-primary hover:underline">
            ดูสินค้าทั้งหมด →
          </a>
        </div>
      ) : (
        <ul className="space-y-3">
          {waitlist
            .filter((w) => w.status === "waiting")
            .map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
              >
                {item.productImageUrl ? (
                  <img
                    src={`/api/r2-url?key=${encodeURIComponent(item.productImageUrl)}`}
                    alt=""
                    className="h-14 w-14 rounded-lg object-cover border"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                    <Bell className="h-6 w-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.productName ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    สมัคร {new Date(item.createdAt).toLocaleDateString("th-TH")}
                  </p>
                </div>
                <LeaveWaitlistButton productId={item.productId} />
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
