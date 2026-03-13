import Link from "next/link";
import {
  addFamilyMemberAction,
  createFamilyGroupAction,
  deleteFamilyGroupAction,
  removeFamilyMemberAction,
} from "@/features/youtube/youtube-stock.actions";
import { findFamilyGroupsWithMembers } from "@/features/youtube/youtube-stock.repo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      <form action={createFamilyGroupAction} className="grid gap-2 rounded-xl border bg-card p-4 md:grid-cols-4">
        <Input name="name" placeholder="ชื่อกลุ่ม family" required />
        <Input name="limit" type="number" min={1} defaultValue={6} required />
        <Input name="notes" placeholder="หมายเหตุ (ไม่บังคับ)" />
        <Button type="submit">เพิ่ม family group</Button>
      </form>

      <div className="space-y-3">
        {familyData.groups.map((group) => (
          <div key={group.id} className="rounded-lg border bg-card p-3">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {group.name} ({group.used}/{group.limit})
                </p>
                <p className="text-xs text-muted-foreground">{group.notes ?? "-"}</p>
              </div>
              <form action={deleteFamilyGroupAction}>
                <input type="hidden" name="id" value={group.id} />
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  ลบกลุ่ม
                </Button>
              </form>
            </div>
            <form action={addFamilyMemberAction} className="mb-2 flex gap-2">
              <input type="hidden" name="family_group_id" value={group.id} />
              <Input name="email" placeholder="อีเมลสมาชิกใหม่" required />
              <Button type="submit" size="sm">
                เพิ่มสมาชิก
              </Button>
            </form>
            <ul className="space-y-1 text-sm">
              {(familyData.membersByGroup[group.id] ?? []).map((m) => (
                <li key={m.id} className="flex items-center justify-between rounded bg-muted/40 px-2 py-1">
                  <span>
                    {m.email} {m.orderId ? `(order ${m.orderId})` : ""}
                  </span>
                  <form action={removeFamilyMemberAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive">
                      ลบ
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

