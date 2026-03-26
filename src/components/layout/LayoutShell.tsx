"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AnnouncementModal } from "@/components/announcement/announcement-modal";
import type { ShopSettings } from "@/features/settings/settings.repo";
import type { CustomerSessionUser } from "@/lib/auth-customer-server";

type LayoutShellProps = {
  shop: ShopSettings | null;
  customer: CustomerSessionUser | null;
  hasMembership?: boolean;
  cartCount?: number;
  children: React.ReactNode;
};

export function LayoutShell({ shop, customer, hasMembership = false, cartCount = 0, children }: LayoutShellProps) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard") ?? false;
  const isDisplay = pathname?.startsWith("/display") ?? false;

  if (isDashboard || isDisplay) {
    return <>{children}</>;
  }

  return (
    <>
      <AnnouncementModal />
      {shop && <Navbar shop={shop} customer={customer} hasMembership={hasMembership} cartCount={cartCount} />}
      <main className="min-h-screen mt-14">{children}</main>
      {shop && <Footer shop={shop} customer={customer} />}
    </>
  );
}
