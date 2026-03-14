import Link from "next/link";
import { Instagram, Twitter } from "lucide-react";
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
    <footer className="border-t border-brand-border bg-brand-bg py-12 text-brand-fg-muted">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-5">
          {/* Column 1: Brand */}
          <div className="col-span-2 flex flex-col gap-3 sm:col-span-1">
            <Link
              href="/"
              className="text-lg font-semibold text-brand-accent-muted hover:text-brand-accent-muted/90"
            >
              {shopName}
            </Link>
            <p className="text-sm">{shopDescription}</p>
            <div className="mt-1 flex gap-4">
              <a
                href="#"
                className="text-brand-fg-muted hover:text-brand-fg"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-brand-fg-muted hover:text-brand-fg"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Column 2: บริการ */}
          <div>
            <h3 className="mb-4 text-sm font-medium text-brand-fg">
              บริการ
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/rent" className="hover:text-brand-fg">
                  รายการเช่า
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-brand-fg">
                  วิธีเช่า
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-brand-fg">
                  ตะกร้า
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: บัญชี */}
          <div>
            <h3 className="mb-4 text-sm font-medium text-brand-fg">
              บัญชี
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/membership" className="hover:text-brand-fg">
                  สมัครสมาชิก
                </Link>
              </li>
              {customer ? (
                <li>
                  <Link href="/account/orders" className="hover:text-brand-fg">
                    ประวัติการเช่า
                  </Link>
                </li>
              ) : (
                <>
                  <li>
                    <Link href="/register" className="hover:text-brand-fg">
                      สมัครสมาชิก
                    </Link>
                  </li>
                  <li>
                    <Link href="/customer-login" className="hover:text-brand-fg">
                      เข้าสู่ระบบ
                    </Link>
                  </li>
                </>
              )}
              <li>
                <Link href="/account/profile" className="hover:text-brand-fg">
                  บัญชีของฉัน
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-brand-fg">
                  พนักงาน
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: ข้อมูล */}
          <div>
            <h3 className="mb-4 text-sm font-medium text-brand-fg">
              ข้อมูล
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/#features" className="hover:text-brand-fg">
                  ฟีเจอร์
                </Link>
              </li>
              <li>
                <Link href="/#contact" className="hover:text-brand-fg">
                  ติดต่อเรา
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: กฎหมาย */}
          <div>
            <h3 className="mb-4 text-sm font-medium text-brand-fg">
              กฎหมาย
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/terms" className="hover:text-brand-fg">
                  ข้อกำหนดและเงื่อนไข
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-brand-fg">
                  นโยบายความเป็นส่วนตัว
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-10 text-xs text-brand-fg-subtle">
          © {new Date().getFullYear()} {shopName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
