import Link from "next/link";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { isLinePlaceholderEmail } from "@/lib/line-verify";
import {
  findActiveMembershipByCustomerId,
  findCustomerMembershipsByCustomerId,
} from "@/features/membership/membership.repo";
import { Button } from "@/components/ui/button";
import { ProfileTabs } from "./profile-tabs";

/** แปลงเป็น ISO string เพื่อส่งไป client ให้ format วันที่ได้ถูกต้อง */
function toSerializedDate(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  const d = v instanceof Date ? v : new Date(v as number);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

export default async function ProfilePage() {
  const customer = await getCustomerSession();
  if (!customer) return null;

  const [activeMembership, membershipHistory] = await Promise.all([
    findActiveMembershipByCustomerId(customer.id),
    findCustomerMembershipsByCustomerId(customer.id),
  ]);

  return (
    <div className="space-y-8">
      {/* <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/account">← บัญชี</Link>
        </Button>
        <h1 className="mt-2 text-xl font-semibold">โปรไฟล์</h1>
      </div> */}

      <ProfileTabs
        profileDefaultValues={{
          name: customer.name,
          email: customer.email,
          phone: customer.phone ?? "",
        }}
        isLineUser={customer.isLineUser}
        isPlaceholderEmail={customer.isLineUser && isLinePlaceholderEmail(customer.email)}
        lineDisplayName={customer.lineDisplayName ?? null}
        linePictureUrl={customer.linePictureUrl ?? null}
        activeMembership={
          activeMembership
            ? {
                plan: {
                  name: activeMembership.plan.name,
                  billingType: activeMembership.plan.billingType,
                  freeRentalDays: activeMembership.plan.freeRentalDays,
                  discountPercent: activeMembership.plan.discountPercent,
                  expiresAt: toSerializedDate(activeMembership.expiresAt),
                },
              }
            : null
        }
        membershipHistory={membershipHistory.map((sub) => ({
          id: sub.id,
          status: sub.status,
          startedAt: toSerializedDate(sub.startedAt),
          expiresAt: toSerializedDate(sub.expiresAt),
          createdAt: toSerializedDate(sub.createdAt),
          plan: { name: sub.plan.name, billingType: sub.plan.billingType },
        }))}
      />
    </div>
  );
}
