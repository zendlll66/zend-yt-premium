import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { findCustomerByEmail, createCustomer } from "@/features/customer/customer.repo";
import { signCustomerSession, CUSTOMER_COOKIE_NAME } from "@/lib/auth-customer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() || null : null;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "กรุณากรอกชื่อ อีเมล และรหัสผ่าน" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" },
        { status: 400 }
      );
    }

    const existing = await findCustomerByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "อีเมลนี้มีการสมัครแล้ว" },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 10);
    const customer = await createCustomer({
      name,
      email,
      passwordHash,
      phone,
    });
    if (!customer) {
      return NextResponse.json(
        { error: "สมัครไม่สำเร็จ" },
        { status: 500 }
      );
    }

    const value = signCustomerSession(customer.id);
    const res = NextResponse.json({
      ok: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
    });
    res.cookies.set(CUSTOMER_COOKIE_NAME, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return res;
  } catch {
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}
