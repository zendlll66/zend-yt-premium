import Link from "next/link";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ShopSettings } from "@/features/settings/settings.repo";
import type { CustomerSessionUser } from "@/lib/auth-customer-server";

type NavbarProps = {
  shop: ShopSettings;
  customer: CustomerSessionUser | null;
};

const Navbar = ({ shop, customer }: NavbarProps) => {
  const shopName = shop.shopName || "Zend Rental";
  const logoUrl = shop.shopLogo?.trim();
  const logoSrc = logoUrl
    ? logoUrl.startsWith("http")
      ? logoUrl
      : `/api/r2-url?key=${encodeURIComponent(logoUrl)}`
    : null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight text-white">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt=""
              className="h-9 w-9 rounded-xl object-cover ring-1 ring-white/10"
            />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-lg font-bold text-white">
              {shopName.charAt(0).toUpperCase() || "Z"}
            </span>
          )}
          <span className="text-xl">{shopName}</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="text-white/90 hover:bg-white/10 hover:text-white">
            <Link href="/rent">รายการเช่า</Link>
          </Button>
          {customer ? (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-white/90 hover:bg-white/10 hover:text-white"
            >
              <Link href="/account/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                โปรไฟล์
              </Link>
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-white/90 hover:bg-white/10 hover:text-white"
              >
                <Link href="/customer-login">เข้าสู่ระบบ</Link>
              </Button>
              <Button size="sm" className="bg-white text-neutral-900 hover:bg-white/90" asChild>
                <Link href="/register">สมัครสมาชิก</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;