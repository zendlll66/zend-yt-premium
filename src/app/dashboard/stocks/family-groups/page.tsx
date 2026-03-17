import Link from "next/link";
import {
  addFamilyMemberAction,
  createFamilyGroupAction,
  deleteFamilyGroupAction,
  removeFamilyMemberAction,
  updateFamilyGroupAction,
  updateFamilyMemberAction,
} from "@/features/youtube/youtube-stock.actions";
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
      <form action={createFamilyGroupAction} className="grid gap-2 rounded-xl border bg-card p-4 md:grid-cols-6">
        <Input name="name" placeholder="ชื่อกลุ่ม family" required />
        <Input name="limit" type="number" min={1} defaultValue={6} required />
        <Input name="head_email" placeholder="Head account email (ไม่บังคับ)" />
        <Input name="head_password" placeholder="Head account password (ไม่บังคับ)" />
        <Input name="notes" placeholder="หมายเหตุ (ไม่บังคับ)" />
        <FormSubmitButton loadingText="กำลังเพิ่ม…">เพิ่ม family group</FormSubmitButton>
      </form>

      <div className="space-y-3">
        {familyData.groups.map((group) => {
          const members = familyData.membersByGroup[group.id] ?? [];
          const inUseCount = members.filter((m) => m.memberStatus === "in_use").length;
          const releasedCount = members.filter((m) => m.memberStatus === "released").length;
          const availableCount = members.filter((m) => m.memberStatus === "available").length + releasedCount;
          const stockedCount = members.length;

          return (
          <details key={group.id} className="rounded-lg border bg-card p-3">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {group.name} ({inUseCount}/{stockedCount || 0})
                  </p>
                  <p className="text-xs text-muted-foreground">{group.notes ?? "-"}</p>
                  <p className="text-xs text-muted-foreground">
                    คงเหลือในคลัง {availableCount} · ส่งให้ลูกค้าแล้ว {inUseCount}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">กดเพื่อเปิด/ปิด</span>
              </div>
            </summary>

            <div className="mt-3 space-y-2 border-t pt-3">
              <div className="flex justify-end">
                <form action={deleteFamilyGroupAction}>
                  <input type="hidden" name="id" value={group.id} />
                  <FormSubmitButton
                    size="sm"
                    variant="outline"
                    loadingText="กำลังลบ…"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    ลบกลุ่ม
                  </FormSubmitButton>
                </form>
              </div>

              <form action={updateFamilyGroupAction} className="grid gap-2 md:grid-cols-6">
                <input type="hidden" name="id" value={group.id} />
                <Input
                  name="name"
                  defaultValue={group.name}
                  placeholder="ชื่อกลุ่ม"
                />
                <Input
                  name="limit"
                  type="number"
                  min={1}
                  defaultValue={group.limit}
                  placeholder="limit"
                />
                <Input
                  name="notes"
                  defaultValue={group.notes ?? ""}
                  placeholder="หมายเหตุ"
                />
                <Input
                  name="head_email"
                  defaultValue={group.headEmail ?? ""}
                  placeholder="Head account email"
                />
                <Input
                  name="head_password"
                  defaultValue={group.headPassword ?? ""}
                  placeholder="Head account password"
                />
                <FormSubmitButton size="sm" variant="outline" loadingText="กำลังบันทึก…">
                  บันทึกข้อมูลกลุ่ม
                </FormSubmitButton>
              </form>

              <form action={addFamilyMemberAction} className="flex gap-2">
                <input type="hidden" name="family_group_id" value={group.id} />
                <Input name="email" placeholder="อีเมลสมาชิกใหม่" required />
                <Input name="member_password" placeholder="รหัสผ่านสมาชิก" required />
                <FormSubmitButton size="sm" loadingText="กำลังเพิ่ม…">
                  เพิ่มสมาชิก
                </FormSubmitButton>
              </form>

              <div className="rounded-lg border bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2">Password</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">ลูกค้าที่ใช้</th>
                        <th className="px-3 py-2">Order</th>
                        <th className="px-3 py-2 text-right">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">
                            ยังไม่มีสมาชิกในกลุ่มนี้
                          </td>
                        </tr>
                      ) : (
                        members.map((m) => (
                          <tr key={m.id} className="border-b last:border-0">
                            <td className="px-3 py-2">
                              <Input
                                name="email"
                                form={`edit-family-member-${m.id}`}
                                defaultValue={m.email}
                                className="h-8"
                                placeholder="Email"
                                required
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                name="member_password"
                                form={`edit-family-member-${m.id}`}
                                defaultValue={m.memberPassword ?? ""}
                                className="h-8"
                                placeholder="Password"
                                required
                              />
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs ${
                                  m.memberStatus === "in_use"
                                    ? "bg-green-100 text-green-700"
                                    : m.memberStatus === "released"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {m.memberStatus === "in_use"
                                  ? "กำลังใช้งาน"
                                  : m.memberStatus === "released"
                                    ? "คืนคลังแล้ว"
                                    : "พร้อมใช้งาน"}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              {m.customerIdResolved ? (
                                <Link
                                  href={`/dashboard/customers/${m.customerIdResolved}`}
                                  className="inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs hover:bg-muted"
                                >
                                  {m.customerLinePictureUrl ? (
                                    <img
                                      src={m.customerLinePictureUrl}
                                      alt=""
                                      className="h-5 w-5 rounded-full object-cover"
                                    />
                                  ) : (
                                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px]">
                                      U
                                    </span>
                                  )}
                                  <span>
                                    {m.customerLineDisplayName ?? m.customerName ?? m.customerEmail ?? "customer"}
                                  </span>
                                </Link>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-3 py-2">{m.orderId ? `order ${m.orderId}` : "-"}</td>
                            <td className="px-3 py-2 text-right">
                              <div className="flex justify-end gap-2">
                                <form id={`edit-family-member-${m.id}`} action={updateFamilyMemberAction}>
                                  <input type="hidden" name="id" value={m.id} />
                                  <FormSubmitButton size="sm" variant="outline" loadingText="กำลังบันทึก…">
                                    บันทึก
                                  </FormSubmitButton>
                                </form>
                                <form action={removeFamilyMemberAction}>
                                  <input type="hidden" name="id" value={m.id} />
                                  <FormSubmitButton size="sm" variant="ghost" loadingText="กำลังลบ…" className="h-8 px-2 text-destructive">
                                    ลบ
                                  </FormSubmitButton>
                                </form>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </details>
          );
        })}
      </div>
    </div>
  );
}

