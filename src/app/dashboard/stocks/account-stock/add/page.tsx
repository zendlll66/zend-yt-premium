import Link from "next/link";
import { createAccountStockAction } from "@/features/youtube/youtube-stock.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSubmitButton } from "@/components/ui/form-submit-button";

export default function AddAccountStockPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/stocks/account-stock">← Individual Account Stock</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">เพิ่ม Account Stock</h1>
      <form
        action={createAccountStockAction}
        className="flex max-w-md flex-col gap-4 rounded-xl border bg-card p-6"
      >
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            Email / Username *
          </label>
          <Input
            id="email"
            name="email"
            placeholder="email หรือ username สำหรับล็อกอิน"
            required
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
            Password *
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="รหัสผ่าน"
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
            <option value="sold">sold</option>
          </select>
        </div>
        <div className="flex gap-2">
          <FormSubmitButton loadingText="กำลังเพิ่ม…">เพิ่ม stock</FormSubmitButton>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/stocks/account-stock">ยกเลิก</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
