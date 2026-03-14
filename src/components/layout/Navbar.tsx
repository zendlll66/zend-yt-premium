import Link from "next/link";
import { User, Crown, ShoppingBag } from "lucide-react";
import type { ShopSettings } from "@/features/settings/settings.repo";
import type { CustomerSessionUser } from "@/lib/auth-customer-server";

type NavbarProps = {
  shop: ShopSettings;
  customer: CustomerSessionUser | null;
  hasMembership?: boolean;
  cartCount?: number;
};

const navLink =
  "rounded-lg px-3 py-2 text-sm font-medium text-brand-fg/85 transition hover:bg-white/10 hover:text-brand-fg";

const Navbar = ({ shop, customer, hasMembership = false, cartCount = 0 }: NavbarProps) => {
  const shopName = shop.shopName || "Zend Rental";
  const logoUrl = shop.shopLogo?.trim();
  const logoSrc = logoUrl
    ? logoUrl.startsWith("http")
      ? logoUrl
      : `/api/r2-url?key=${encodeURIComponent(logoUrl)}`
    : null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-brand-border bg-brand-bg/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 font-semibold tracking-tight text-brand-fg"
        >
          {logoSrc ? (
            <img
              src={logoSrc}
              alt=""
              className="h-8 w-8 rounded-lg object-cover ring-1 ring-brand-border"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-accent text-sm font-bold text-white">
              {shopName.charAt(0).toUpperCase() || "Z"}
            </span>
          )}
          <span className="hidden text-lg sm:inline">{shopName}</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link href="/rent" className={navLink}>
            รายการเช่า
          </Link>
          <Link href="/cart" className={`${navLink} relative flex items-center gap-1.5`}>
            <ShoppingBag className="h-4 w-4" />
            {cartCount > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-accent px-1 text-[10px] font-bold text-white"
                aria-label={`ตะกร้ามี ${cartCount} รายการ`}
              >
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
            <span className="hidden sm:inline">ตะกร้า</span>
          </Link>
            <span className="mx-1 h-4 w-px bg-brand-border" aria-hidden />
          {customer ? (
            <Link
              href="/account/profile"
              className={
                hasMembership
                  ? "flex items-center gap-1.5 rounded-lg border border-brand-accent-muted/50 bg-brand-accent/20 px-3 py-2 text-sm font-medium text-brand-fg transition hover:bg-brand-accent/30"
                  : `${navLink} flex items-center gap-1.5`
              }
            >
              {hasMembership ? (
                <Crown className="h-4 w-4 text-brand-accent-muted" />
              ) : (
                <User className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{hasMembership ? "สมาชิก" : "บัญชี"}</span>
            </Link>
          ) : (
            <>
              <Link href="/customer-login" className={navLink}>
                เข้าสู่ระบบ
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-brand-accent px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-accent-hover"
              >
                สมัครสมาชิก
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;