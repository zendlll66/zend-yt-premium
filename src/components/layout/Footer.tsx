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
    <footer className="border-t border-neutral-700/60 bg-neutral-950 py-12 text-neutral-300">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-5">
          {/* Column 1: Brand */}
          <div className="col-span-2 flex flex-col gap-3 sm:col-span-1">
            <Link
              href="/"
              className="text-lg font-semibold text-violet-400 hover:text-violet-300"
            >
              {shopName}
            </Link>
            <p className="text-sm">{shopDescription}</p>
            <div className="mt-1 flex gap-4">
              <a
                href="#"
                className="text-neutral-400 hover:text-neutral-200"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-neutral-400 hover:text-neutral-200"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Column 2: บริการ */}
          <div>
            <h3 className="mb-4 text-sm font-medium text-neutral-200">
              บริการ
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/rent" className="hover:text-white">
                  รายการเช่า
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-white">
                  วิธีเช่า
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white">
                  ตะกร้า
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: บัญชี */}
          <div>
            <h3 className="mb-4 text-sm font-medium text-neutral-200">
              บัญชี
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/membership" className="hover:text-white">
                  สมัครสมาชิก
                </Link>
              </li>
              {customer ? (
                <li>
                  <Link href="/account/orders" className="hover:text-white">
                    ประวัติการเช่า
                  </Link>
                </li>
              ) : (
                <>
                  <li>
                    <Link href="/register" className="hover:text-white">
                      สมัครสมาชิก
                    </Link>
                  </li>
                  <li>
                    <Link href="/customer-login" className="hover:text-white">
                      เข้าสู่ระบบ
                    </Link>
                  </li>
                </>
              )}
              <li>
                <Link href="/account/profile" className="hover:text-white">
                  บัญชีของฉัน
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white">
                  พนักงาน
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: ข้อมูล */}
          <div>
            <h3 className="mb-4 text-sm font-medium text-neutral-200">
              ข้อมูล
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/#features" className="hover:text-white">
                  ฟีเจอร์
                </Link>
              </li>
              <li>
                <Link href="/#contact" className="hover:text-white">
                  ติดต่อเรา
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: กฎหมาย */}
          <div>
            <h3 className="mb-4 text-sm font-medium text-neutral-200">
              กฎหมาย
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/terms" className="hover:text-white">
                  ข้อกำหนดและเงื่อนไข
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white">
                  นโยบายความเป็นส่วนตัว
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-10 text-xs text-neutral-500">
          © {new Date().getFullYear()} {shopName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
