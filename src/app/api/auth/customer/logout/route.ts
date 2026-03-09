import { NextRequest, NextResponse } from "next/server";
import { CUSTOMER_COOKIE_NAME } from "@/lib/auth-customer";

export async function POST(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/";
  const res = NextResponse.redirect(url);
  res.cookies.set(CUSTOMER_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return res;
}
