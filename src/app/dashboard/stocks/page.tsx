import { findAccountStocks, findCustomerAccounts, findFamilyGroupsWithMembers } from "@/features/youtube/youtube-stock.repo";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function memberIsInviteOnly(m: { inviteLink: string | null }) {
  return Boolean(m.inviteLink?.trim());
}

export default async function StocksPage() {
  const [accounts, familyData, customerAccounts] = await Promise.all([
    findAccountStocks(100),
    findFamilyGroupsWithMembers(),
    findCustomerAccounts(200),
  ]);
  const accountAvailable = accounts.filter((a) => a.status === "available").length;
  const accountUsed = accounts.filter((a) => a.status === "sold").length;
  const familyUsed = familyData.groups.reduce((sum, g) => {
    const members = familyData.membersByGroup[g.id] ?? [];
    return sum + members.filter((m) => m.memberStatus === "in_use").length;
  }, 0);
  const familyAvailableCredential = familyData.groups.reduce((sum, g) => {
    const members = familyData.membersByGroup[g.id] ?? [];
    return (
      sum +
      members.filter(
        (m) => !memberIsInviteOnly(m) && (m.memberStatus === "available" || m.memberStatus === "released")
      ).length
    );
  }, 0);
  const familyAvailableInvite = familyData.groups.reduce((sum, g) => {
    const members = familyData.membersByGroup[g.id] ?? [];
    return (
      sum +
      members.filter(
        (m) => memberIsInviteOnly(m) && (m.memberStatus === "available" || m.memberStatus === "released")
      ).length
    );
  }, 0);

  const customerPending = customerAccounts.filter((c) => c.status === "pending").length;
  const customerDone = customerAccounts.filter((c) => c.status === "done").length;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Manage Stock</h1>
        <p className="text-sm text-muted-foreground">
          แยกหน้าจัดการตามประเภท stock เพื่อทำงานง่ายขึ้น — ลิงก์เชิญ (สินค้า Invite) จัดการภายใต้ Family Groups
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-medium">Individual Accounts</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            คงเหลือ {accountAvailable} · ส่งแล้ว {accountUsed}
          </p>
          <Button className="mt-3" asChild>
            <Link href="/dashboard/stocks/account-stock">จัดการ Individual</Link>
          </Button>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-medium">Family Groups</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            ช่องว่าง (อีเมล+รหัส): {familyAvailableCredential} · ช่องลิงก์เชิญ (Invite): {familyAvailableInvite} ·
            ส่งแล้ว {familyUsed}
          </p>
          <Button className="mt-3" asChild>
            <Link href="/dashboard/stocks/family-groups">จัดการ Family / ลิงก์เชิญ</Link>
          </Button>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-medium">Customer Accounts</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            รอดำเนินการ {customerPending} · เสร็จแล้ว {customerDone}
          </p>
          <Button className="mt-3" asChild>
            <Link href="/dashboard/stocks/customer-accounts">จัดการ Customer Accounts</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
