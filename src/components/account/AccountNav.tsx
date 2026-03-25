"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Package, User, Wallet, Bell, TicketCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/account/orders", label: "ประวัติการซื้อ", icon: ShoppingBag },
  { href: "/account/inventory", label: "รหัสของฉัน", icon: Package },
  { href: "/account/wallet", label: "Wallet", icon: Wallet },
  { href: "/account/waitlist", label: "รอ stock", icon: Bell },
  { href: "/account/support", label: "แจ้งปัญหา", icon: TicketCheck },
  { href: "/account/profile", label: "โปรไฟล์", icon: User },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 sm:gap-2">
      {links.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname?.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
