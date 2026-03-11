import { findMembershipPlans } from "@/features/membership/membership.repo";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { MembershipPlansClient } from "./membership-plans-client";

const BILLING_LABEL: Record<string, string> = {
  monthly: "รายเดือน",
  yearly: "รายปี",
};

export default async function MembershipPage() {
  const customer = await getCustomerSession();
  const plans = await findMembershipPlans(true);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">สมัครสมาชิก</h1>
      <p className="mt-2 text-muted-foreground">
        เลือกแผนรายเดือนหรือรายปี ใช้สิทธิ์วันเช่าฟรีและส่วนลดเมื่อเช่า
      </p>

      <MembershipPlansClient
        plans={plans.map((p) => ({
          id: p.id,
          name: p.name,
          billingType: p.billingType,
          price: p.price,
          freeRentalDays: p.freeRentalDays,
          discountPercent: p.discountPercent,
          description: p.description,
          billingLabel: BILLING_LABEL[p.billingType] ?? p.billingType,
        }))}
        isLoggedIn={!!customer}
      />
    </div>
  );
}
