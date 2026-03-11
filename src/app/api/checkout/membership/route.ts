import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { findMembershipPlanById } from "@/features/membership/membership.repo";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

/** สร้าง Stripe Checkout Session สำหรับสมัครสมาชิก (แผนรายเดือน/รายปี) */
export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe ไม่ได้ตั้งค่า" },
      { status: 503 }
    );
  }
  const customer = await getCustomerSession();
  if (!customer) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  try {
    const { planId } = (await req.json()) as { planId?: number };
    if (!planId || !Number.isFinite(planId)) {
      return NextResponse.json({ error: "กรุณาเลือกแผน" }, { status: 400 });
    }

    const plan = await findMembershipPlanById(planId);
    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "ไม่พบแผนหรือแผนปิดใช้งาน" }, { status: 404 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const amountSatang = Math.round(Number(plan.price) * 100);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "thb",
            unit_amount: amountSatang,
            product_data: {
              name: plan.name,
              description: plan.billingType === "yearly" ? "สมาชิกรายปี" : "สมาชิกรายเดือน",
            },
          },
        },
      ],
      metadata: {
        type: "membership",
        planId: String(plan.id),
        customerId: String(customer.id),
      },
      success_url: `${baseUrl}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/membership/checkout?planId=${plan.id}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("Checkout membership error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "สร้างลิงก์ชำระเงินไม่สำเร็จ" },
      { status: 500 }
    );
  }
}
