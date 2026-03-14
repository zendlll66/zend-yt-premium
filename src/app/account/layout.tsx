import { redirect } from "next/navigation";
import Link from "next/link";
import { UserCircle, LogOut } from "lucide-react";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { isLinePlaceholderEmail } from "@/lib/line-verify";
import { AccountNav } from "@/components/account/AccountNav";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const customer = await getCustomerSession();
  if (!customer) {
    redirect("/customer-login?from=/account");
  }

  const displayName =
    customer.isLineUser && isLinePlaceholderEmail(customer.email)
      ? customer.name
      : customer.email;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 border-b border-border/40 bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <Link
                href="/account"
                className="flex items-center gap-2 font-semibold text-foreground transition hover:opacity-90"
              >
                <UserCircle className="h-6 w-6 text-muted-foreground" />
                บัญชีของฉัน
              </Link>
              <form action="/api/auth/customer/logout" method="POST">
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/10 hover:border-destructive/30"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">ออกจากระบบ</span>
                </button>
              </form>
            </div>
            <p className="truncate text-sm text-muted-foreground" title={displayName}>
              {displayName}
            </p>
            <AccountNav />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
