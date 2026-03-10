import Link from "next/link";
import type { ShopSettings } from "@/features/settings/settings.repo";
import type { CustomerSessionUser } from "@/lib/auth-customer-server";

type FooterProps = {
  shop: ShopSettings;
  customer: CustomerSessionUser | null;
};

const Footer = ({ shop, customer }: FooterProps) => {
  const shopName = shop.shopName || "Zend Rental";
  const shopDescription = shop.shopDescription || "ระบบเช่าอุปกรณ์ครบวงจร";

  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <Link href="/" className="font-semibold tracking-tight">
            {shopName}
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <Link href="/rent" className="hover:text-foreground">
              รายการเช่า
            </Link>
            {!customer && (
              <>
                <Link href="/register" className="hover:text-foreground">
                  สมัครสมาชิก
                </Link>
                <Link href="/customer-login" className="hover:text-foreground">
                  เข้าสู่ระบบ
                </Link>
              </>
            )}
            <Link href="/login" className="hover:text-foreground">
              พนักงาน
            </Link>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {shopName}. {shopDescription}
        </p>
      </div>
    </footer>
  );
};

export default Footer;