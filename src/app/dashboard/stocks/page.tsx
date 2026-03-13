import {
  findAccountStocks,
  findCustomerAccounts,
  findFamilyGroupsWithMembers,
  findInviteLinks,
} from "@/features/youtube/youtube-stock.repo";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function StocksPage() {
  const [accounts, familyData, links, customerAccounts] = await Promise.all([
    findAccountStocks(100),
    findFamilyGroupsWithMembers(),
    findInviteLinks(200),
    findCustomerAccounts(200),
  ]);
  const accountAvailable = accounts.filter((a) => a.status === "available").length;
  const accountUsed = accounts.filter((a) => a.status === "sold").length;
  const familyUsed = familyData.groups.reduce((sum, g) => {
    const members = familyData.membersByGroup[g.id] ?? [];
    return sum + members.filter((m) => m.memberStatus === "in_use").length;
  }, 0);
  const familyAvailable = familyData.groups.reduce((sum, g) => {
    const members = familyData.membersByGroup[g.id] ?? [];
    const available = members.filter((m) => m.memberStatus === "available").length;
    const released = members.filter((m) => m.memberStatus === "released").length;
    return sum + available + released;
  }, 0);
  const inviteAvailable = links.filter((l) => l.status === "available").length;
  const inviteUsed = links.filter((l) => l.status === "used").length;
  const customerPending = customerAccounts.filter((c) => c.status === "pending").length;
  const customerDone = customerAccounts.filter((c) => c.status === "done").length;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Manage Stock</h1>
        <p className="text-sm text-muted-foreground">
          แยกหน้าจัดการตามประเภท stock เพื่อทำงานง่ายขึ้น
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
            คงเหลือ {familyAvailable} slot · ส่งแล้ว {familyUsed}
          </p>
          <Button className="mt-3" asChild>
            <Link href="/dashboard/stocks/family-groups">จัดการ Family</Link>
          </Button>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-medium">Invite Links</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            คงเหลือ {inviteAvailable} · ส่งแล้ว {inviteUsed}
          </p>
          <Button className="mt-3" asChild>
            <Link href="/dashboard/stocks/invite-links">จัดการ Invite Links</Link>
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

