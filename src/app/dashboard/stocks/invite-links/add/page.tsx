import Link from "next/link";
import { createInviteLinkAction } from "@/features/youtube/youtube-stock.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSubmitButton } from "@/components/ui/form-submit-button";

export default function AddInviteLinkPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/stocks/invite-links">← Invite Links</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">เพิ่ม Invite Link</h1>
      <form
        action={createInviteLinkAction}
        className="flex max-w-md flex-col gap-4 rounded-xl border bg-card p-6"
      >
        <div>
          <label htmlFor="link" className="mb-1.5 block text-sm font-medium">
            Link *
          </label>
          <Input
            id="link"
            name="link"
            placeholder="https://youtube.com/invite/..."
            required
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="status" className="mb-1.5 block text-sm font-medium">
            สถานะ
          </label>
          <select
            id="status"
            name="status"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            defaultValue="available"
          >
            <option value="available">available</option>
            <option value="reserved">reserved</option>
            <option value="used">used</option>
          </select>
        </div>
        <div className="flex gap-2">
          <FormSubmitButton loadingText="กำลังเพิ่ม…">เพิ่ม invite link</FormSubmitButton>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/stocks/invite-links">ยกเลิก</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
