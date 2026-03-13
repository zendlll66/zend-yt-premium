import { redirect } from "next/navigation";
import Link from "next/link";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { isLinePlaceholderEmail } from "@/lib/line-verify";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const customer = await getCustomerSession();
  if (!customer) {
    redirect("/customer-login?from=/account");
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border/40 bg-background">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link href="/account" className="font-semibold text-foreground">
            บัญชีของฉัน
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              {customer.isLineUser && isLinePlaceholderEmail(customer.email)
                ? customer.name
                : customer.email}
            </span>
            <form action="/api/auth/customer/logout" method="POST">
              <button
                type="submit"
                className="rounded-lg px-3 py-1.5 text-destructive hover:bg-destructive/10"
              >
                ออกจากระบบ
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-2xl gap-1 px-4 pb-2">
          <Link
            href="/account/orders"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            ประวัติการซื้อ
          </Link>
          <Link
            href="/account/inventory"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Inventory
          </Link>
          <Link
            href="/account/profile"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            โปรไฟล์
          </Link>
          <Link
            href="/account/addresses"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            ที่อยู่จัดส่ง
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
    </div>
  );
}
