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
  isLineUser: boolean;
  isPlaceholderEmail: boolean;
  lineDisplayName: string | null;
  linePictureUrl: string | null;
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

function ProfileSummaryCard({
  name,
  email,
  phone,
  isLineUser,
  isPlaceholderEmail,
  lineDisplayName,
  linePictureUrl,
}: {
  name: string;
  email: string;
  phone: string;
  isLineUser: boolean;
  isPlaceholderEmail: boolean;
  lineDisplayName: string | null;
  linePictureUrl: string | null;
}) {
  const displayName = (lineDisplayName || name) || "—";
  const displayEmail = isPlaceholderEmail ? null : email;
  const displayPhone = phone?.trim() || null;

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
        <div className="shrink-0">
          {linePictureUrl ? (
            <img
              src={linePictureUrl}
              alt="รูปโปรไฟล์"
              className="h-24 w-24 rounded-full border-2 border-border object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-border bg-muted text-3xl font-medium text-muted-foreground">
              {displayName.charAt(0).toUpperCase() || "?"}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h2 className="text-xl font-semibold">{displayName}</h2>
            {isLineUser && (
              <Badge variant="secondary" className="bg-[#06C755]/15 text-[#06C755] border-[#06C755]/30">
                LINE
              </Badge>
            )}
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex flex-wrap items-baseline gap-2">
              <dt className="font-medium text-muted-foreground">อีเมล</dt>
              <dd className="break-all">
                {displayEmail ? (
                  <a href={`mailto:${displayEmail}`} className="text-foreground hover:underline">
                    {displayEmail}
                  </a>
                ) : (
                  <span className="text-muted-foreground">ยังไม่ได้เพิ่มอีเมล</span>
                )}
              </dd>
            </div>
            <div className="flex flex-wrap items-baseline gap-2">
              <dt className="font-medium text-muted-foreground">เบอร์โทร</dt>
              <dd>
                {displayPhone ? (
                  <a href={`tel:${displayPhone}`} className="text-foreground hover:underline">
                    {displayPhone}
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

export function ProfileTabs({
  profileDefaultValues,
  isLineUser,
  isPlaceholderEmail,
  lineDisplayName,
  linePictureUrl,
  activeMembership,
  membershipHistory,
}: ProfileTabsProps) {
  const [tab, setTab] = useState<"profile" | "history">("profile");

  return (
    <div className="space-y-8">
      {/* สรุปโปรไฟล์ — ชื่อ รูป อีเมล เบอร์ จาก LINE */}
      <ProfileSummaryCard
        name={profileDefaultValues.name}
        email={profileDefaultValues.email}
        phone={profileDefaultValues.phone}
        isLineUser={isLineUser}
        isPlaceholderEmail={isPlaceholderEmail}
        lineDisplayName={lineDisplayName}
        linePictureUrl={linePictureUrl}
      />

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
                <ProfileForm
                  defaultValues={profileDefaultValues}
                  isLineUser={isLineUser}
                  isPlaceholderEmail={isPlaceholderEmail}
                />
              </div>
              {!isLineUser && (
                <div>
                  <h3 className="mb-4 font-medium">เปลี่ยนรหัสผ่าน</h3>
                  <ChangePasswordForm />
                </div>
              )}
              {isLineUser && (
                <div>
                  <h3 className="mb-4 font-medium">ตั้งรหัสผ่าน</h3>
                  <p className="mb-2 text-sm text-muted-foreground">
                    ตั้งรหัสผ่านเพื่อเข้าสู่ระบบด้วยอีเมลได้ (ไม่บังคับ)
                  </p>
                  <ChangePasswordForm isSetPassword />
                </div>
              )}
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
