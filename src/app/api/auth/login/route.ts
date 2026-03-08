import { NextResponse } from "next/server";
import { verifyAdminLogin } from "@/features/admin/admin.service";
import { COOKIE_NAME, signSessionCookie } from "@/lib/auth-session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await verifyAdminLogin(email, password);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const value = signSessionCookie(user.id);
    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    res.cookies.set(COOKIE_NAME, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return res;
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
