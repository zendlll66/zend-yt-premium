import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { verifyLineIdToken } from "@/lib/line-verify";
import {
  findCustomerByLineUserId,
  findCustomerById,
  createCustomer,
  updateCustomer,
} from "@/features/customer/customer.repo";
import { signCustomerSession, CUSTOMER_COOKIE_NAME } from "@/lib/auth-customer";

const LINE_PLACEHOLDER_EMAIL_PREFIX = "line-";
const LINE_PLACEHOLDER_EMAIL_SUFFIX = "@liff.user";

function linePlaceholderEmail(lineUserId: string): string {
  return `${LINE_PLACEHOLDER_EMAIL_PREFIX}${lineUserId}${LINE_PLACEHOLDER_EMAIL_SUFFIX}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const idToken = typeof body.idToken === "string" ? body.idToken.trim() : "";
    if (!idToken) {
      return NextResponse.json(
        { error: "ไม่พบ id_token จาก LINE" },
        { status: 400 }
      );
    }

    const payload = await verifyLineIdToken(idToken);
    if (!payload) {
      return NextResponse.json(
        { error: "ยืนยันตัวตนกับ LINE ไม่สำเร็จ" },
        { status: 401 }
      );
    }

    const { sub: lineUserId, name: lineName, picture: linePicture } = payload;
    const displayName = (typeof lineName === "string" ? lineName.trim() : "") || "ผู้ใช้ LINE";
    const pictureUrl = typeof linePicture === "string" ? linePicture.trim() || null : null;

    let customer: any = await findCustomerByLineUserId(lineUserId);

    if (customer) {
      // อัปเดตชื่อ/รูปจาก LINE ทุกครั้งที่ล็อกอิน
      await updateCustomer(customer.id, {
        lineDisplayName: displayName,
        linePictureUrl: pictureUrl,
        name: displayName,
      });
      customer = await findCustomerById(customer.id);
      if (!customer) {
        return NextResponse.json(
          { error: "โหลดข้อมูลไม่สำเร็จ" },
          { status: 500 }
        );
      }
    } else {
      const placeholderEmail = linePlaceholderEmail(lineUserId);
      const passwordHash = await hash(
        `liff-${lineUserId}-${Date.now()}-${Math.random().toString(36)}`,
        10
      );
      const created = await createCustomer({
        name: displayName,
        email: placeholderEmail,
        passwordHash,
        phone: null,
        lineUserId,
        lineDisplayName: displayName,
        linePictureUrl: pictureUrl,
      });
      if (!created) {
        return NextResponse.json(
          { error: "สมัครสมาชิกไม่สำเร็จ" },
          { status: 500 }
        );
      }
      customer = await findCustomerById(created.id);
      if (!customer) {
        return NextResponse.json(
          { error: "โหลดข้อมูลไม่สำเร็จ" },
          { status: 500 }
        );
      }
    }

    const value = signCustomerSession(customer.id);
    const res = NextResponse.json({
      ok: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        isLineUser: !!customer.lineUserId,
      },
    });
    res.cookies.set(CUSTOMER_COOKIE_NAME, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch {
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}
