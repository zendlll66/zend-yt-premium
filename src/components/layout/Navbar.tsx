"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Crown, ShoppingBag, Menu, Home, Package, LogIn, UserPlus, TicketCheck, Phone } from "lucide-react";
import type { ShopSettings } from "@/features/settings/settings.repo";
import type { CustomerSessionUser } from "@/lib/auth-customer-server";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type NavbarProps = {
  shop: ShopSettings;
  customer: CustomerSessionUser | null;
  hasMembership?: boolean;
  cartCount?: number;
};

const navLink =
  "rounded-lg px-3 py-2 text-sm font-medium text-brand-fg/85 transition hover:bg-white/10 hover:text-brand-fg";

const Navbar = ({ shop, customer, hasMembership = false, cartCount = 0 }: NavbarProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const shopName = shop.shopName || "Zend Rental";
  const logoUrl = shop.shopLogo?.trim();
  const logoSrc = logoUrl
    ? logoUrl.startsWith("http")
      ? logoUrl
      : `/api/r2-url?key=${encodeURIComponent(logoUrl)}`
    : null;

  const navItems = (
    <>
      <Link href="/rent" className={navLink} onClick={() => setMenuOpen(false)}>
        สินค้า
      </Link>
      <Link href="/contact" className={navLink} onClick={() => setMenuOpen(false)}>
        ติดต่อเรา
      </Link>
      <Link href="/cart" className={`${navLink} relative flex items-center gap-1.5`} onClick={() => setMenuOpen(false)}>
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
      <span className="mx-1 h-4 w-px bg-brand-border aria-hidden" aria-hidden />
      {customer ? (
        <>
          <Link href="/account/support" className={`${navLink} flex items-center gap-1.5`} onClick={() => setMenuOpen(false)}>
            <TicketCheck className="h-4 w-4" />
            <span className="hidden lg:inline">แจ้งปัญหา</span>
          </Link>
          <Link
            href="/account/profile"
            className={
              hasMembership
                ? "flex items-center gap-1.5 rounded-lg border border-brand-accent-muted/50 bg-brand-accent/20 px-3 py-2 text-sm font-medium text-brand-fg transition hover:bg-brand-accent/30"
                : `${navLink} flex items-center gap-1.5`
            }
            onClick={() => setMenuOpen(false)}
          >
            {hasMembership ? (
              <Crown className="h-4 w-4 text-brand-accent-muted" />
            ) : (
              <User className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{hasMembership ? "สมาชิก" : "บัญชี"}</span>
          </Link>
        </>
      ) : (
        <>
          <Link href="/customer-login" className={navLink} onClick={() => setMenuOpen(false)}>
            เข้าสู่ระบบ
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-brand-accent px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-accent-hover"
            onClick={() => setMenuOpen(false)}
          >
            สมัครสมาชิก
          </Link>
        </>
      )}
    </>
  );

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

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">{navItems}</div>

        {/* Mobile: menu button + sheet */}
        <div className="flex items-center gap-1 md:hidden">
          <Link href="/cart" className="relative rounded-lg p-2 text-brand-fg hover:bg-white/10">
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-accent px-1 text-[10px] font-bold text-white"
                aria-label={`ตะกร้ามี ${cartCount} รายการ`}
              >
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-brand-fg hover:bg-white/10">
                <Menu className="h-5 w-5" />
                <span className="sr-only">เปิดเมนู</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(320px,85vw)] border-brand-border bg-brand-bg p-0">
              <SheetTitle className="sr-only">เมนูนำทาง</SheetTitle>
              <div className="flex flex-col gap-0.5 p-4">
                <Link
                  href="/"
                  className="flex items-center gap-3 rounded-xl p-4 text-base font-medium text-brand-fg transition hover:bg-white/10"
                  onClick={() => setMenuOpen(false)}
                >
                  <Home className="h-5 w-5 shrink-0 text-brand-fg/70" />
                  หน้าแรก
                </Link>
                <Link
                  href="/rent"
                  className="flex items-center gap-3 rounded-xl p-4 text-base font-medium text-brand-fg transition hover:bg-white/10"
                  onClick={() => setMenuOpen(false)}
                >
                  <Package className="h-5 w-5 shrink-0 text-brand-fg/70" />
                  สินค้า
                </Link>
                <Link
                  href="/contact"
                  className="flex items-center gap-3 rounded-xl p-4 text-base font-medium text-brand-fg transition hover:bg-white/10"
                  onClick={() => setMenuOpen(false)}
                >
                  <Phone className="h-5 w-5 shrink-0 text-brand-fg/70" />
                  ติดต่อเรา
                </Link>
                <Link
                  href="/cart"
                  className="flex items-center gap-3 rounded-xl p-4 text-base font-medium text-brand-fg transition hover:bg-white/10"
                  onClick={() => setMenuOpen(false)}
                >
                  <ShoppingBag className="h-5 w-5 shrink-0 text-brand-fg/70" />
                  ตะกร้า
                  {cartCount > 0 && (
                    <span className="ml-auto rounded-full bg-brand-accent px-2.5 py-0.5 text-xs font-bold text-white">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </Link>
                <span className="my-1 h-px bg-brand-border" />
                {customer ? (
                  <>
                    <Link
                      href="/account/support"
                      className="flex items-center gap-3 rounded-xl p-4 text-base font-medium text-brand-fg transition hover:bg-white/10"
                      onClick={() => setMenuOpen(false)}
                    >
                      <TicketCheck className="h-5 w-5 shrink-0 text-brand-fg/70" />
                      แจ้งปัญหา
                    </Link>
                    <Link
                      href="/account/profile"
                      className="flex items-center gap-3 rounded-xl p-4 text-base font-medium text-brand-fg transition hover:bg-white/10"
                      onClick={() => setMenuOpen(false)}
                    >
                      {hasMembership ? (
                        <Crown className="h-5 w-5 shrink-0 text-brand-accent-muted" />
                      ) : (
                        <User className="h-5 w-5 shrink-0 text-brand-fg/70" />
                      )}
                      {hasMembership ? "สมาชิก" : "บัญชี"}
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/customer-login"
                      className="flex items-center gap-3 rounded-xl p-4 text-base font-medium text-brand-fg transition hover:bg-white/10"
                      onClick={() => setMenuOpen(false)}
                    >
                      <LogIn className="h-5 w-5 shrink-0 text-brand-fg/70" />
                      เข้าสู่ระบบ
                    </Link>
                    <Link
                      href="/register"
                      className="flex items-center gap-3 rounded-xl bg-brand-accent p-4 text-base font-medium text-white transition hover:bg-brand-accent-hover"
                      onClick={() => setMenuOpen(false)}
                    >
                      <UserPlus className="h-5 w-5 shrink-0" />
                      สมัครสมาชิก
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
