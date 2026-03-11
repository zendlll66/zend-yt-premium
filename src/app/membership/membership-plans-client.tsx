"use client";

import Link from "next/link";
import { Crown, Gift, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatMoney(n: number) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

type PlanForDisplay = {
  id: number;
  name: string;
  billingType: string;
  price: number;
  freeRentalDays: number;
  discountPercent: number;
  description: string | null;
  billingLabel: string;
};

export function MembershipPlansClient({
  plans,
  isLoggedIn,
}: {
  plans: PlanForDisplay[];
  isLoggedIn: boolean;
}) {
  if (plans.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-border bg-muted/20 py-12 text-center text-muted-foreground">
        ตอนนี้ยังไม่มีแผนสมาชิก
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-2">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
            <Crown className="h-5 w-5" />
            <span className="font-semibold">{plan.name}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{plan.billingLabel}</p>
          <p className="mt-4 text-2xl font-bold tabular-nums">
            {formatMoney(plan.price)} ฿
            <span className="text-sm font-normal text-muted-foreground">
              /{plan.billingType === "yearly" ? "ปี" : "เดือน"}
            </span>
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {plan.freeRentalDays > 0 && (
              <li className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-violet-500" />
                ได้วันเช่าฟรี {plan.freeRentalDays} วัน
              </li>
            )}
            {plan.discountPercent > 0 && (
              <li className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-violet-500" />
                ส่วนลด {plan.discountPercent}% ทุกครั้งที่เช่า
              </li>
            )}
            {plan.description && (
              <li className="text-muted-foreground">{plan.description}</li>
            )}
          </ul>
          <div className="mt-6 flex-1" />
          {isLoggedIn ? (
            <Button asChild className="w-full">
              <Link href={`/membership/checkout?planId=${plan.id}`}>สมัคร</Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="w-full">
              <Link href={`/customer-login?from=${encodeURIComponent(`/membership/checkout?planId=${plan.id}`)}`}>
                เข้าสู่ระบบเพื่อสมัคร
              </Link>
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
