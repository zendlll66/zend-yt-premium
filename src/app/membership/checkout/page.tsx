import { redirect } from "next/navigation";
import Link from "next/link";
import { findMembershipPlanById } from "@/features/membership/membership.repo";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { MembershipCheckoutClient } from "./membership-checkout-client";

function formatMoney(n: number) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

const BILLING_LABEL: Record<string, string> = {
  monthly: "รายเดือน",
  yearly: "รายปี",
};

export default async function MembershipCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ planId?: string }>;
}) {
  const { planId: planIdStr } = await searchParams;
  const customer = await getCustomerSession();
  const checkoutFrom = Number.isFinite(parseInt(planIdStr ?? "", 10))
    ? `/membership/checkout?planId=${planIdStr}`
    : "/membership/checkout";
  if (!customer) {
    redirect(`/customer-login?from=${encodeURIComponent(checkoutFrom)}`);
  }
  const planId = planIdStr ? parseInt(planIdStr, 10) : NaN;
  if (!Number.isFinite(planId)) redirect("/membership");
  const plan = await findMembershipPlanById(planId);
  if (!plan || !plan.isActive) redirect("/membership");

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-xl font-semibold">ชำระค่าสมาชิก</h1>
      <div className="mt-6 rounded-xl border bg-card p-6">
        <p className="font-medium">{plan.name}</p>
        <p className="text-sm text-muted-foreground">{BILLING_LABEL[plan.billingType] ?? plan.billingType}</p>
        <p className="mt-2 text-2xl font-bold tabular-nums">{formatMoney(plan.price)} ฿</p>
        <MembershipCheckoutClient planId={plan.id} price={plan.price} planName={plan.name} />
      </div>
      <p className="mt-4 text-center">
        <Link href="/membership" className="text-sm text-muted-foreground hover:underline">
          ← กลับไปเลือกแผน
        </Link>
      </p>
    </div>
  );
}
