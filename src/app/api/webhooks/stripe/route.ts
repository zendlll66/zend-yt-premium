import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { setOrderStripePayment, getOrderWithCustomer } from "@/features/order/order.repo";
import { debitWallet } from "@/features/wallet/wallet.repo";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

/** รับ Stripe webhook (checkout.session.completed) แล้วอัปเดตคำสั่งเป็น paid */
export async function POST(req: NextRequest) {
  if (!stripe || !webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    if (!sig) return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
    event = stripe!.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (e) {
    console.error("Stripe webhook signature verification failed:", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (!orderId) {
      console.error("checkout.session.completed missing metadata.orderId");
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }
    const paymentIntentId = session.payment_intent as string | null;
    const numOrderId = parseInt(orderId, 10);
    const updated = await setOrderStripePayment(
      numOrderId,
      paymentIntentId || session.id,
      session.payment_status || "paid"
    );
    // หักเงิน wallet หลัง Stripe ยืนยันการชำระเงินสำเร็จ
    if (updated?.status === "paid") {
      try {
        const orderDetail = await getOrderWithCustomer(numOrderId);
        if (orderDetail && orderDetail.walletCreditUsed > 0 && orderDetail.customerId) {
          await debitWallet(orderDetail.customerId, orderDetail.walletCreditUsed, numOrderId, `ชำระ Order #${orderDetail.orderNumber}`);
        }
      } catch { /* ไม่ block webhook */ }
    }
  }

  return NextResponse.json({ received: true });
}
