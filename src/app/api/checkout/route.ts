import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { findOrderById } from "@/features/order/order.repo";
import { db } from "@/db";
import { payments } from "@/db/schema/payment.schema";
import { getShopSettings } from "@/features/settings/settings.repo";
import { and, eq } from "drizzle-orm";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

/** สร้าง Stripe Checkout Session สำหรับคำสั่งซื้อ */
export async function POST(req: NextRequest) {
  try {
    const { orderId, paymentMethod } = (await req.json()) as {
      orderId?: number;
      paymentMethod?: "stripe" | "bank";
    };
    if (!orderId || !Number.isFinite(orderId)) {
      return NextResponse.json({ error: "orderId ต้องเป็นตัวเลข" }, { status: 400 });
    }
    const method = paymentMethod ?? "stripe";

    const order = await findOrderById(orderId);
    if (!order) return NextResponse.json({ error: "ไม่พบคำสั่ง" }, { status: 404 });
    if (order.status !== "pending") {
      return NextResponse.json({ error: "คำสั่งนี้ชำระแล้วหรือยกเลิกแล้ว" }, { status: 400 });
    }

    const shop = await getShopSettings();
    if (method === "bank") {
      if (shop.paymentBankEnabled !== "1") {
        return NextResponse.json({ error: "ยังไม่เปิดใช้งานการโอนธนาคาร" }, { status: 400 });
      }
      const amount = Math.round(Number(order.totalPrice) * 100) / 100;
      const promptPay = (shop.bankPromptpayId || "").trim();
      const qrImageUrl = promptPay
        ? `https://promptpay.io/${encodeURIComponent(promptPay)}/${amount.toFixed(2)}.png`
        : null;

      await db
        .delete(payments)
        .where(and(eq(payments.orderId, order.id), eq(payments.provider, "bank_transfer"), eq(payments.status, "pending")));

      await db.insert(payments).values({
        orderId: order.id,
        provider: "bank_transfer",
        amount,
        currency: "THB",
        status: "pending",
        createdAt: new Date(),
      });

      return NextResponse.json({
        paymentMethod: "bank",
        bankName: shop.bankName,
        bankAccountName: shop.bankAccountName,
        bankAccountNumber: shop.bankAccountNumber,
        promptPayId: promptPay,
        qrImageUrl,
        amount,
      });
    }

    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe ไม่ได้ตั้งค่า (เพิ่ม STRIPE_SECRET_KEY ใน .env)" },
        { status: 503 }
      );
    }
    if (shop.paymentStripeEnabled !== "1") {
      return NextResponse.json({ error: "ยังไม่เปิดใช้งาน Stripe" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const amountSatang = Math.round(Number(order.totalPrice) * 100); // THB -> satang
    const productTypeText = getProductTypeText(order.productType);

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
              name: `คำสั่งซื้อ #${order.orderNumber}`,
              description: `ประเภทสินค้า: ${productTypeText}`,
            },
          },
        },
      ],
      metadata: { orderId: String(order.id) },
      success_url: `${baseUrl}/rent/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${baseUrl}/rent?cancel=1`,
    });

    return NextResponse.json({ paymentMethod: "stripe", url: session.url });
  } catch (e) {
    console.error("Checkout error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "สร้างลิงก์ชำระเงินไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

function getProductTypeText(productType: string): string {
  if (productType === "individual") return "Individual";
  if (productType === "family") return "Family";
  if (productType === "invite") return "Invite Link";
  if (productType === "customer_account") return "Customer Account";
  return productType;
}
