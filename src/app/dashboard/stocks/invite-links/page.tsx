import Link from "next/link";
import {
  createInviteLinkAction,
  deleteInviteLinkAction,
  updateInviteLinkStatusAction,
} from "@/features/youtube/youtube-stock.actions";
import { findInviteLinks } from "@/features/youtube/youtube-stock.repo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function InviteLinksPage() {
  const links = await findInviteLinks(500);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/stocks">← Manage Stock</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">Invite Links</h1>
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
        <Button type="submit">เพิ่ม invite link</Button>
      </form>

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2">Link</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {links.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-3 py-2">{row.link}</td>
                  <td className="px-3 py-2">
                    <form action={updateInviteLinkStatusAction} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={row.id} />
                      <select
                        name="status"
                        defaultValue={row.status}
                        className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
                      >
                        <option value="available">available</option>
                        <option value="reserved">reserved</option>
                        <option value="used">used</option>
                      </select>
                      <Button size="sm" variant="outline" type="submit">
                        บันทึก
                      </Button>
                    </form>
                  </td>
                  <td className="px-3 py-2">{row.orderId ?? "-"}</td>
                  <td className="px-3 py-2 text-right">
                    <form action={deleteInviteLinkAction}>
                      <input type="hidden" name="id" value={row.id} />
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        ลบ
                      </Button>
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

