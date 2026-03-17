import Link from "next/link";
import {
  createInviteLinkAction,
  deleteInviteLinkAction,
  updateInviteLinkAction,
} from "@/features/youtube/youtube-stock.actions";
import { findInviteLinks } from "@/features/youtube/youtube-stock.repo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSubmitButton } from "@/components/ui/form-submit-button";

export default async function InviteLinksPage() {
  const links = await findInviteLinks(500);
  const availableCount = links.filter((l) => l.status === "available").length;
  const reservedCount = links.filter((l) => l.status === "reserved").length;
  const usedCount = links.filter((l) => l.status === "used").length;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/stocks">← Manage Stock</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">Invite Links</h1>
      <div className="grid gap-2 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-3 text-sm">คงเหลือในคลัง: <b>{availableCount}</b></div>
        <div className="rounded-lg border bg-card p-3 text-sm">กำลังจอง: <b>{reservedCount}</b></div>
        <div className="rounded-lg border bg-card p-3 text-sm">ส่งให้ลูกค้าแล้ว: <b>{usedCount}</b></div>
      </div>
      <form action={createInviteLinkAction} className="grid gap-2 rounded-xl border bg-card p-4 md:grid-cols-3">
        <Input name="link" placeholder="https://youtube.com/invite/..." required />
        <select
          name="status"
          defaultValue="available"
          className="h-9 rounded-4xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="available">available</option>
          <option value="reserved">reserved</option>
          <option value="used">used</option>
        </select>
        <FormSubmitButton loadingText="กำลังเพิ่ม…">เพิ่ม invite link</FormSubmitButton>
      </form>

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2">Link</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">ลูกค้าที่ใช้</th>
                <th className="px-3 py-2 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {links.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <form action={updateInviteLinkAction} className="grid gap-2 md:grid-cols-3">
                      <input type="hidden" name="id" value={row.id} />
                      <Input name="link" defaultValue={row.link} className="h-8" />
                      <select
                        name="status"
                        defaultValue={row.status}
                        className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
                      >
                        <option value="available">available</option>
                        <option value="reserved">reserved</option>
                        <option value="used">used</option>
                      </select>
                      <FormSubmitButton size="sm" variant="outline" loadingText="กำลังบันทึก…">
                        บันทึก
                      </FormSubmitButton>
                    </form>
                  </td>
                  <td className="px-3 py-2">
                    {row.status}
                  </td>
                  <td className="px-3 py-2">{row.orderId ?? "-"}</td>
                  <td className="px-3 py-2">
                    {row.customerId ? (
                      <Link
                        href={`/dashboard/customers/${row.customerId}`}
                        className="inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs hover:bg-muted"
                      >
                        {row.customerLinePictureUrl ? (
                          <img src={row.customerLinePictureUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
                        ) : (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px]">U</span>
                        )}
                        <span>{row.customerLineDisplayName ?? row.customerName ?? row.customerEmail}</span>
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <form action={deleteInviteLinkAction}>
                      <input type="hidden" name="id" value={row.id} />
                      <FormSubmitButton
                        size="sm"
                        variant="outline"
                        loadingText="กำลังลบ…"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        ลบ
                      </FormSubmitButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

