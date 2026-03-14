import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CUSTOMER_COOKIE_NAME = "customer_session";

/**
 * บังคับ login เฉพาะเมื่อเข้าผ่าน LIFF (เส้นทาง /liff)
 * เว็บปกติ (/, /rent, /cart ฯลฯ) ไม่บังคับ login
 */
const LIFF_PATH_PREFIX = "/liff";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isLiffPath =
    pathname === LIFF_PATH_PREFIX || pathname.startsWith(LIFF_PATH_PREFIX + "/");

  if (!isLiffPath) {
    return NextResponse.next();
  }

  const hasCustomerCookie = request.cookies.has(CUSTOMER_COOKIE_NAME);
  if (!hasCustomerCookie) {
    const from = encodeURIComponent(pathname + (request.nextUrl.search || ""));
    const url = new URL("/customer-login", request.url);
    url.searchParams.set("from", from);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
