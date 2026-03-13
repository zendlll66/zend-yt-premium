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
          <p className="mt-1 text-sm text-muted-foreground">จำนวน {accounts.length} รายการ</p>
          <Button className="mt-3" asChild>
            <Link href="/dashboard/stocks/account-stock">จัดการ Individual</Link>
          </Button>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-medium">Family Groups</h2>
          <p className="mt-1 text-sm text-muted-foreground">จำนวน {familyData.groups.length} กลุ่ม</p>
          <Button className="mt-3" asChild>
            <Link href="/dashboard/stocks/family-groups">จัดการ Family</Link>
          </Button>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-medium">Invite Links</h2>
          <p className="mt-1 text-sm text-muted-foreground">จำนวน {links.length} ลิงก์</p>
          <Button className="mt-3" asChild>
            <Link href="/dashboard/stocks/invite-links">จัดการ Invite Links</Link>
          </Button>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <h2 className="font-medium">Customer Accounts</h2>
          <p className="mt-1 text-sm text-muted-foreground">จำนวน {customerAccounts.length} รายการ</p>
          <Button className="mt-3" asChild>
            <Link href="/dashboard/stocks/customer-accounts">จัดการ Customer Accounts</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

