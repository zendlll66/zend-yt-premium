import Link from "next/link";
import { KeyRound, LinkIcon, Mail, Package, ShoppingBag } from "lucide-react";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { findCustomerInventory } from "@/features/inventory/customer-inventory.repo";
import { renewInventoryItemAction } from "@/features/inventory/inventory-renewal.actions";
import { Button } from "@/components/ui/button";

function getTypeConfig(type: string): { label: string; icon: typeof Package; className: string } {
  switch (type) {
    case "individual":
      return { label: "Individual", icon: KeyRound, className: "bg-blue-500/10 text-blue-700 dark:text-blue-300" };
    case "family":
      return { label: "Family", icon: Package, className: "bg-violet-500/10 text-violet-700 dark:text-violet-300" };
    case "invite":
      return { label: "Invite Link", icon: LinkIcon, className: "bg-amber-500/10 text-amber-700 dark:text-amber-300" };
    case "customer_account":
      return { label: "บัญชีส่งร้าน", icon: Mail, className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" };
    default:
      return { label: type, icon: Package, className: "bg-muted text-muted-foreground" };
  }
}

function getRemainingDays(expiresAt: Date | null): number | null {
  if (!expiresAt) return null;
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return Math.max(0, diffDays);
}

function ExpiryBadge({ expiresAt, durationMonths }: { expiresAt: Date | null; durationMonths: number }) {
  const days = getRemainingDays(expiresAt);
  if (days === null) {
    return (
      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
        อายุ {durationMonths} เดือน
      </span>
    );
  }
  const isExpired = days === 0;
  const isSoon = days > 0 && days <= 7;
  const style = isExpired
    ? "bg-red-500/15 text-red-700 dark:text-red-300"
    : isSoon
      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
      : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
  const text = isExpired ? "หมดอายุ" : `เหลือ ${days} วัน`;
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold tabular-nums ${style}`}>
      {text}
    </span>
  );
}

export default async function AccountInventoryPage() {
  const customer = await getCustomerSession();
  if (!customer) return null;

  const items = await findCustomerInventory(customer.id);
  const now = Date.now();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Package className="h-7 w-7 text-muted-foreground" />
          รหัสของฉัน
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          รายการที่ชำระเงินแล้ว — ใช้อีเมล/รหัสผ่านหรือลิงก์ด้านล่างเพื่อเข้าใช้งาน
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 py-16 px-6 text-center">
          <ShoppingBag className="h-12 w-12 text-muted-foreground/60" />
          <p className="mt-4 font-medium text-foreground">ยังไม่มีรหัสในบัญชี</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            หลังชำระเงินสำเร็จ รหัสหรือลิงก์จะแสดงในหน้านี้
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link href="/rent">ไปเลือกแพ็กเกจ</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:gap-5">
          {items.map((item) => {
            const typeConfig = getTypeConfig(item.itemType);
            const TypeIcon = typeConfig.icon;
            return (
              <li
                key={item.id}
                className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition hover:shadow-md"
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${typeConfig.className}`}
                        >
                          <TypeIcon className="h-3.5 w-3.5" />
                          {typeConfig.label}
                        </span>
                        <ExpiryBadge expiresAt={item.expiresAt} durationMonths={item.durationMonths} />
                      </div>
                      {item.expiresAt && new Date(item.expiresAt).getTime() <= now && (
                        <form action={renewInventoryItemAction} className="mt-3">
                          <input type="hidden" name="inventoryId" value={item.id} />
                          <Button type="submit" variant="secondary" size="sm" className="w-full">
                            ต่ออายุ
                          </Button>
                        </form>
                      )}
                      <h2 className="mt-3 font-semibold text-foreground">{item.title}</h2>
                      {item.orderNumber && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          ออเดอร์ {item.orderNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-3 rounded-xl bg-muted/40 p-3 sm:p-4">
                    {item.loginEmail && (
                      <div className="flex items-start gap-3">
                        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-muted-foreground">อีเมล</p>
                          <p className="mt-0.5 break-all font-mono text-sm text-foreground">
                            {item.loginEmail}
                          </p>
                        </div>
                      </div>
                    )}
                    {item.loginPassword && (
                      <div className="flex items-start gap-3">
                        <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-muted-foreground">รหัสผ่าน</p>
                          <p className="mt-0.5 break-all font-mono text-sm text-foreground">
                            {item.loginPassword}
                          </p>
                        </div>
                      </div>
                    )}
                    {item.inviteLink && (
                      <div className="flex items-start gap-3">
                        <LinkIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-muted-foreground">ลิงก์เชิญ</p>
                          <a
                            href={item.inviteLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 block break-all font-mono text-sm text-primary underline-offset-4 hover:underline"
                          >
                            {item.inviteLink}
                          </a>
                        </div>
                      </div>
                    )}
                    {!item.loginEmail && !item.loginPassword && !item.inviteLink && (
                      <p className="text-sm text-muted-foreground">
                        ยังไม่มีข้อมูลรหัสในระบบ — กรุณาติดต่อแอดมิน
                      </p>
                    )}
                    {item.note && (
                      <p className="border-t border-border/60 pt-3 text-sm text-muted-foreground">
                        {item.note}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
