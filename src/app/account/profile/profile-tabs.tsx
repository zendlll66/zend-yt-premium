"use client";

import { useState } from "react";
import Link from "next/link";
import { ProfileForm } from "./profile-form";
import { ChangePasswordForm } from "./change-password-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type PlanInfo = {
  name: string;
  billingType: string;
  freeRentalDays: number;
  discountPercent: number;
  /** ISO date string จาก server */
  expiresAt: string;
};

type SubscriptionItem = {
  id: number;
  status: string;
  startedAt: string;
  expiresAt: string;
  createdAt: string;
  plan: { name: string; billingType: string };
};

type ProfileTabsProps = {
  profileDefaultValues: { name: string; email: string; phone: string };
  activeMembership: { plan: PlanInfo } | null;
  membershipHistory: SubscriptionItem[];
};

function formatDate(d: Date | string | number | null | undefined): string {
  if (d == null) return "—";
  const date = typeof d === "number" || typeof d === "string" ? new Date(d) : d;
  const time = date.getTime();
  if (Number.isNaN(time)) return "—";
  return date.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const BILLING_LABEL: Record<string, string> = {
  monthly: "รายเดือน",
  yearly: "รายปี",
};

export function ProfileTabs({
  profileDefaultValues,
  activeMembership,
  membershipHistory,
}: ProfileTabsProps) {
  const [tab, setTab] = useState<"profile" | "history">("profile");

  return (
    <div className="space-y-8">
      {/* โปรสมาชิกที่ใช้อยู่ */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-3 font-medium">โปรสมาชิกของฉัน</h2>
        {activeMembership ? (
          <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/50 p-4">
            <div>
              <p className="font-semibold">{activeMembership.plan.name}</p>
              <p className="text-sm text-muted-foreground">
                {BILLING_LABEL[activeMembership.plan.billingType] ?? activeMembership.plan.billingType}
                {" · หมดอายุ "}
                {formatDate(activeMembership.plan.expiresAt)}
              </p>
              {(activeMembership.plan.freeRentalDays > 0 || activeMembership.plan.discountPercent > 0) && (
                <p className="mt-1 text-xs text-muted-foreground">
                  สิทธิ์: วันเช่าฟรี {activeMembership.plan.freeRentalDays} วัน
                  {activeMembership.plan.discountPercent > 0 &&
                    ` · ส่วนลด ${activeMembership.plan.discountPercent}%`}
                </p>
              )}
            </div>
            <Badge className="bg-green-600 text-white">ใช้งานอยู่</Badge>
          </div>
        ) : (
          <p className="rounded-lg bg-muted/30 p-4 text-sm text-muted-foreground">
            คุณยังไม่มีโปรสมาชิกที่ใช้งานอยู่
            <Link href="/membership" className="ml-2 font-medium text-primary hover:underline">
              ดูแผนและสมัคร
            </Link>
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="rounded-xl border bg-card">
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setTab("profile")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              tab === "profile"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            โปรไฟล์
          </button>
          <button
            type="button"
            onClick={() => setTab("history")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              tab === "history"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            ประวัติการสมัครสมาชิก
          </button>
        </div>

        <div className="p-6">
          {tab === "profile" && (
            <div className="space-y-8">
              <div>
                <h3 className="mb-4 font-medium">ข้อมูลส่วนตัว</h3>
                <ProfileForm defaultValues={profileDefaultValues} />
              </div>
              <div>
                <h3 className="mb-4 font-medium">เปลี่ยนรหัสผ่าน</h3>
                <ChangePasswordForm />
              </div>
            </div>
          )}

          {tab === "history" && (
            <div>
              {membershipHistory.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  ยังไม่มีประวัติการสมัครสมาชิก
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="pb-2 font-medium">แผน</th>
                        <th className="pb-2 font-medium">สถานะ</th>
                        <th className="pb-2 font-medium">เริ่มต้น</th>
                        <th className="pb-2 font-medium">หมดอายุ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {membershipHistory.map((sub) => (
                        <tr key={sub.id} className="border-b border-border/60 last:border-0">
                          <td className="py-3">
                            <span className="font-medium">{sub.plan.name}</span>
                            <span className="ml-1 text-muted-foreground">
                              ({BILLING_LABEL[sub.plan.billingType] ?? sub.plan.billingType})
                            </span>
                          </td>
                          <td className="py-3">
                            <Badge
                              variant={sub.status === "active" ? "default" : "secondary"}
                              className={
                                sub.status === "active"
                                  ? "bg-green-600 text-white"
                                  : "bg-muted text-muted-foreground"
                              }
                            >
                              {sub.status === "active" ? "ใช้งานอยู่" : sub.status === "expired" ? "หมดอายุ" : "ยกเลิก"}
                            </Badge>
                          </td>
                          <td className="py-3 text-muted-foreground">{formatDate(sub.startedAt)}</td>
                          <td className="py-3 text-muted-foreground">{formatDate(sub.expiresAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
