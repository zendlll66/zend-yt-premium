import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { getCustomerOrdersForTicket } from "@/features/support/support-ticket.repo";
import { NewTicketForm } from "./new-ticket-form";

export const metadata = { title: "แจ้งปัญหาใหม่" };

export default async function NewTicketPage() {
  const customer = await getCustomerSession();
  if (!customer) redirect("/customer-login?from=/account/support/new");

  const orders = await getCustomerOrdersForTicket(customer.id);

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/account/support"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition mb-3"
        >
          <ChevronLeft className="h-4 w-4" />
          กลับรายการ
        </Link>
        <h1 className="text-lg font-semibold">แจ้งปัญหาใหม่</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          กรอกรายละเอียดเพื่อแจ้งให้ทีมงานดำเนินการ
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-5">
        <NewTicketForm orders={orders} />
      </div>
    </div>
  );
}
