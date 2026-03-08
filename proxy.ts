import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "admin_session";
const SECRET =
  process.env.ADMIN_SESSION_SECRET || "dev-secret-change-in-production";

/** Hex string to Uint8Array */
function hexToBytes(hex: string): Uint8Array {
  const len = hex.length / 2;
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/** Constant-time compare for Edge (no node:crypto) */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Verify cookie using Web Crypto (Edge-compatible) */
async function verifySession(value: string): Promise<boolean> {
  const parts = value.split(".");
  if (parts.length !== 2) return false;
  const [idStr, sigHex] = parts;
  if (!idStr || !sigHex) return false;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(idStr)
    );
    const expected = new Uint8Array(sig);
    const actual = hexToBytes(sigHex);
    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  const isLoggedIn = !!(cookie && (await verifySession(cookie)));

  // Protect dashboard: require login
  if (path.startsWith("/dashboard")) {
    if (!isLoggedIn) {
      const login = new URL("/login", req.url);
      login.searchParams.set("from", path);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  // If already logged in and visiting login, redirect to dashboard or "from"
  if (path.startsWith("/login")) {
    if (isLoggedIn) {
      const from = req.nextUrl.searchParams.get("from");
      const to = from && from.startsWith("/") ? from : "/dashboard";
      return NextResponse.redirect(new URL(to, req.url));
    }
    return NextResponse.next();
  }

  // Legacy: protect /admin the same way
  if (path.startsWith("/admin")) {
    if (!isLoggedIn) {
      const login = new URL("/login", req.url);
      login.searchParams.set("from", path);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/login", "/login/", "/admin", "/admin/:path*"],
};
