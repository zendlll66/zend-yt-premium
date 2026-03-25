import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { getShopSettings } from "@/features/settings/settings.repo";
import { createTopupRequest } from "@/features/wallet/wallet-topup.repo";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const ALLOWED_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export async function POST(req: NextRequest) {
  const customer = await getCustomerSession();
  if (!customer) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const { amount, method } = (await req.json()) as {
    amount?: number;
    method?: "stripe" | "bank";
  };

  if (!amount || !ALLOWED_AMOUNTS.includes(amount)) {
    return NextResponse.json({ error: "จำนวนเงินไม่ถูกต้อง" }, { status: 400 });
  }
  if (method !== "stripe" && method !== "bank") {
    return NextResponse.json({ error: "วิธีชำระไม่ถูกต้อง" }, { status: 400 });
  }

  const shop = await getShopSettings();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  if (method === "stripe") {
    if (!stripe || shop.paymentStripeEnabled !== "1") {
      return NextResponse.json({ error: "Stripe ยังไม่เปิดใช้งาน" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "thb",
            unit_amount: amount * 100,
            product_data: { name: `เติม Wallet ฿${amount.toLocaleString("th-TH")}` },
          },
        },
      ],
      metadata: {
        type: "wallet_topup",
        customerId: String(customer.id),
      },
      success_url: `${baseUrl}/account/wallet?topup=success`,
      cancel_url: `${baseUrl}/account/wallet/topup`,
    });

    const topup = await createTopupRequest({
      customerId: customer.id,
      amount,
      method: "stripe",
      stripeSessionId: session.id,
    });

    return NextResponse.json({ method: "stripe", url: session.url, topupId: topup?.id });
  }

  // bank transfer
  if (shop.paymentBankEnabled !== "1") {
    return NextResponse.json({ error: "การโอนธนาคารยังไม่เปิดใช้งาน" }, { status: 400 });
  }

  const topup = await createTopupRequest({ customerId: customer.id, amount, method: "bank" });
  const promptPay = (shop.bankPromptpayId || "").trim();
  const qrImageUrl = promptPay
    ? `https://promptpay.io/${encodeURIComponent(promptPay)}/${amount.toFixed(2)}.png`
    : null;

  return NextResponse.json({
    method: "bank",
    topupId: topup?.id,
    bankName: shop.bankName,
    bankAccountName: shop.bankAccountName,
    bankAccountNumber: shop.bankAccountNumber,
    promptPayId: promptPay,
    qrImageUrl,
    amount,
  });
}
