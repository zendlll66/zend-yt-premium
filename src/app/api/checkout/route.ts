import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { findOrderById, validateOrderStock } from "@/features/order/order.repo";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

/** สร้าง Stripe Checkout Session สำหรับคำสั่งเช่า (ชำระด้วยบัตร) */
export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe ไม่ได้ตั้งค่า (เพิ่ม STRIPE_SECRET_KEY ใน .env)" },
      { status: 503 }
    );
  }
  try {
    const { orderId } = (await req.json()) as { orderId?: number };
    if (!orderId || !Number.isFinite(orderId)) {
      return NextResponse.json({ error: "orderId ต้องเป็นตัวเลข" }, { status: 400 });
    }

    const order = await findOrderById(orderId);
    if (!order) return NextResponse.json({ error: "ไม่พบคำสั่ง" }, { status: 404 });
    if (order.status !== "pending") {
      return NextResponse.json({ error: "คำสั่งนี้ชำระแล้วหรือยกเลิกแล้ว" }, { status: 400 });
    }
    const stockCheck = await validateOrderStock(orderId);
    if (!stockCheck.ok) return NextResponse.json({ error: stockCheck.error }, { status: 400 });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const amountSatang = Math.round(Number(order.totalPrice) * 100); // THB -> satang

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
              name: `คำสั่งเช่า #${order.orderNumber}`,
              description: `วันที่เช่า ${formatDate(order.rentalStart)} - ${formatDate(order.rentalEnd)}`,
            },
          },
        },
      ],
      metadata: { orderId: String(order.id) },
      success_url: `${baseUrl}/rent/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${baseUrl}/rent?cancel=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("Checkout error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "สร้างลิงก์ชำระเงินไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

function formatDate(d: Date | null): string {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
