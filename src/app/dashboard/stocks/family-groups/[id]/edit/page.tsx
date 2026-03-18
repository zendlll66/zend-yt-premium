import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addFamilyMemberAction,
  removeFamilyMemberAction,
  updateFamilyGroupAction,
  updateFamilyMemberAction,
} from "@/features/youtube/youtube-stock.actions";
import { findFamilyGroupsWithMembers } from "@/features/youtube/youtube-stock.repo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { PasswordInput } from "@/components/ui/password-input";

function daysLeft(expiresAt: Date | null) {
  if (!expiresAt) return null;
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

export default async function EditFamilyGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const groupId = parseInt(id, 10);
  if (!Number.isFinite(groupId)) notFound();

  const familyData = await findFamilyGroupsWithMembers();
  const group = familyData.groups.find((g) => g.id === groupId);
  if (!group) notFound();
  const members = familyData.membersByGroup[groupId] ?? [];
  const inUseCount = members.filter((m) => m.memberStatus === "in_use").length;
  const releasedCount = members.filter((m) => m.memberStatus === "released").length;
  const availableCount =
    members.filter((m) => m.memberStatus === "available").length + releasedCount;
  const stockedCount = members.length;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/stocks/family-groups">← Family Groups</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">แก้ไข Family Group #{group.id}</h1>

      <div className="grid gap-2 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-3 text-sm">
          กลุ่ม: <b>{group.name}</b>
        </div>
        <div className="rounded-lg border bg-card p-3 text-sm">
          ช่องในคลัง: <b>{availableCount}</b> / ทั้งหมด {stockedCount || 0}
        </div>
        <div className="rounded-lg border bg-card p-3 text-sm">
          ส่งให้ลูกค้าแล้ว: <b>{inUseCount}</b>
        </div>
      </div>

      <form
        action={updateFamilyGroupAction}
        className="flex max-w-xl flex-col gap-4 rounded-xl border bg-card p-6"
      >
        <input type="hidden" name="id" value={group.id} />
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
            ชื่อกลุ่ม *
          </label>
          <Input
            id="name"
            name="name"
            defaultValue={group.name}
            placeholder="ชื่อกลุ่ม"
            required
          />
        </div>
        <div>
          <label htmlFor="limit" className="mb-1.5 block text-sm font-medium">
            จำนวนสมาชิกในกลุ่ม (limit) *
          </label>
          <Input
            id="limit"
            name="limit"
            type="number"
            min={1}
            defaultValue={group.limit}
            required
          />
        </div>
        <div>
          <label htmlFor="notes" className="mb-1.5 block text-sm font-medium">
            หมายเหตุ
          </label>
          <Input
            id="notes"
            name="notes"
            defaultValue={group.notes ?? ""}
            placeholder="หมายเหตุ"
          />
        </div>
        <div>
          <label htmlFor="head_email" className="mb-1.5 block text-sm font-medium">
            Head account email
          </label>
          <Input
            id="head_email"
            name="head_email"
            defaultValue={group.headEmail ?? ""}
            placeholder="Head account email"
          />
        </div>
        <PasswordInput
          id="head_password"
          name="head_password"
          label="Head account password"
          defaultValue={group.headPassword ?? ""}
          placeholder="Head account password"
        />
        <div className="flex gap-2">
          <FormSubmitButton loadingText="กำลังบันทึก…">บันทึกข้อมูลกลุ่ม</FormSubmitButton>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/stocks/family-groups">ยกเลิก</Link>
          </Button>
        </div>
      </form>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">สมาชิกในกลุ่มนี้</h2>
        <form
          action={addFamilyMemberAction}
          className="flex max-w-2xl flex-wrap items-center gap-2"
        >
          <input type="hidden" name="family_group_id" value={group.id} />
          <Input
            name="email"
            placeholder="อีเมลสมาชิกใหม่"
            required
            className="flex-1 min-w-[180px]"
          />
          <PasswordInput
            name="member_password"
            placeholder="รหัสผ่านสมาชิก"
            required
            className="flex-1 min-w-[180px]"
          />
          <FormSubmitButton size="sm" loadingText="กำลังเพิ่ม…" className="shrink-0">
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
                  <th className="px-3 py-2">เหลือ</th>
                  <th className="px-3 py-2 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-center text-muted-foreground">
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
                        <PasswordInput
                          name="member_password"
                          form={`edit-family-member-${m.id}`}
                          defaultValue={m.memberPassword ?? ""}
                          placeholder="Password"
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
                              {m.customerLineDisplayName ??
                                m.customerName ??
                                m.customerEmail ??
                                "customer"}
                            </span>
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          name="orderId"
                          form={`edit-family-member-${m.id}`}
                          type="number"
                          min={1}
                          step={1}
                          defaultValue={m.orderId ?? ""}
                          placeholder="ว่างไว้ถ้าไม่มี"
                          className="h-8 w-28"
                        />
                      </td>
                      <td className="px-3 py-2">
                        {(() => {
                          const d = daysLeft((m as { expiresAt?: Date | null }).expiresAt ?? null);
                          if (d == null) return <span className="text-muted-foreground">-</span>;
                          if (d < 0) return <span className="text-destructive font-medium">หมดอายุ</span>;
                          return (
                            <span className={d <= 3 ? "text-amber-600 font-medium" : ""}>
                              {d} วัน
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/dashboard/stocks/family-members/${m.id}/edit`}>
                              แก้ไข
                            </Link>
                          </Button>
                          <form action={removeFamilyMemberAction}>
                            <input type="hidden" name="id" value={m.id} />
                            <FormSubmitButton
                              size="sm"
                              variant="ghost"
                              loadingText="กำลังลบ…"
                              className="h-8 px-2 text-destructive"
                            >
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
    </div>
  );
}

