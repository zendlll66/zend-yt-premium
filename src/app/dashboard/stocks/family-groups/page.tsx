import Link from "next/link";
import { deleteFamilyGroupAction } from "@/features/youtube/youtube-stock.actions";
import { findFamilyGroupsWithMembers } from "@/features/youtube/youtube-stock.repo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSubmitButton } from "@/components/ui/form-submit-button";

export default async function FamilyGroupsPage() {
  const familyData = await findFamilyGroupsWithMembers();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/stocks">← Manage Stock</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">Family Groups</h1>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild>
          <Link href="/dashboard/stocks/family-groups/add">เพิ่ม family group</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/orders/add">สร้าง order ให้ลูกค้า</Link>
        </Button>
      </div>

      <div className="space-y-3">
        {familyData.groups.map((group) => {
          const members = familyData.membersByGroup[group.id] ?? [];
          const inUseCount = members.filter((m) => m.memberStatus === "in_use").length;
          const releasedCount = members.filter((m) => m.memberStatus === "released").length;
          const availableCount = members.filter((m) => m.memberStatus === "available").length + releasedCount;
          const stockedCount = members.length;

          return (
            <div key={group.id} className="rounded-lg border bg-card p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {group.name} ({inUseCount}/{stockedCount || 0})
                  </p>
                  <p className="text-xs text-muted-foreground">{group.notes ?? "-"}</p>
                  <p className="text-xs text-muted-foreground">
                    คงเหลือในคลัง {availableCount} · ส่งให้ลูกค้าแล้ว {inUseCount}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/dashboard/stocks/family-groups/${group.id}/edit`}>แก้ไข</Link>
                  </Button>
                  <form action={deleteFamilyGroupAction}>
                    <input type="hidden" name="id" value={group.id} />
                    <FormSubmitButton
                      size="sm"
                      variant="outline"
                      loadingText="กำลังลบ…"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      ลบ
                    </FormSubmitButton>
                  </form>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

