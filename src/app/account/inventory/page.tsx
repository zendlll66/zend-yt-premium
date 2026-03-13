import Link from "next/link";
import { KeyRound, LinkIcon, Mail } from "lucide-react";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { findCustomerInventory } from "@/features/inventory/customer-inventory.repo";
import { Button } from "@/components/ui/button";

function getTypeLabel(type: string) {
  if (type === "individual") return "Individual";
  if (type === "family") return "Family";
  if (type === "invite") return "Invite Link";
  if (type === "customer_account") return "Customer Account";
  return type;
}

function getRemainingDays(expiresAt: Date | null): number | null {
  if (!expiresAt) return null;
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return Math.max(0, diffDays);
}

export default async function AccountInventoryPage() {
  const customer = await getCustomerSession();
  if (!customer) return null;

  const items = await findCustomerInventory(customer.id);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/account">← บัญชี</Link>
        </Button>
        <h1 className="mt-2 text-xl font-semibold">Inventory ของฉัน</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ข้อมูลบัญชี/ลิงก์ที่ได้รับหลังชำระเงิน จะถูกเก็บไว้ที่หน้านี้
        </p>
      </div>

      <div className="rounded-xl border bg-card p-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูล inventory</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="rounded-lg border bg-muted/30 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{item.title}</p>
                  <span className="text-xs text-muted-foreground">
                    {getTypeLabel(item.itemType)} · {item.orderNumber ?? `#${item.orderId}`}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  อายุแพ็กเกจ {item.durationDays} วัน
                  {item.expiresAt ? ` · เหลือ ${getRemainingDays(item.expiresAt)} วัน` : ""}
                </p>
                <div className="mt-2 space-y-1 text-sm">
                  {item.loginEmail && (
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{item.loginEmail}</span>
                    </p>
                  )}
                  {item.loginPassword && (
                    <p className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-muted-foreground" />
                      <span>{item.loginPassword}</span>
                    </p>
                  )}
                  {item.inviteLink && (
                    <p className="flex items-center gap-2 break-all">
                      <LinkIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{item.inviteLink}</span>
                    </p>
                  )}
                  {item.note && <p className="text-muted-foreground">{item.note}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

