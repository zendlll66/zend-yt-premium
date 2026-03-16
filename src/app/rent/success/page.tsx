import Link from "next/link";
import { CheckCircle } from "lucide-react";
import Stripe from "stripe";
import { Button } from "@/components/ui/button";
import { setOrderStripePayment } from "@/features/order/order.repo";
import { ClearCartOnSuccess } from "./clear-cart";

/** อัปเดต order เป็น paid จาก Stripe session (fallback เมื่อ webhook ยังไม่ถูกเรียก เช่น เทสบน localhost) */
async function confirmPaymentFromSession(sessionId: string, orderId: string) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return;
  const stripe = new Stripe(secret);
  const id = parseInt(orderId, 10);
  if (Number.isNaN(id)) return;

  let session: Stripe.Checkout.Session | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid") break;
      if (attempt === 0) await new Promise((r) => setTimeout(r, 1500));
    } catch (e) {
      if (attempt === 1) {
        console.error("[rent/success] Stripe session retrieve failed:", e);
        return;
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  if (!session || session.payment_status !== "paid") return;
  const metaOrderId = session.metadata?.orderId;
  if (String(metaOrderId ?? "") !== String(orderId)) return;

  try {
    await setOrderStripePayment(
      id,
      (session.payment_intent as string) || session.id,
      session.payment_status || "paid"
    );
  } catch (e) {
    console.error("[rent/success] setOrderStripePayment failed for order", id, e);
    throw e;
  }
}

export default async function RentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; order_id?: string }>;
}) {
  const params = await searchParams;
  const sessionId = params.session_id;
  const orderId = params.order_id;
  if (sessionId && orderId) {
    await confirmPaymentFromSession(sessionId, orderId);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4">
      <ClearCartOnSuccess />
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-green-600 dark:text-green-400">
        <CheckCircle className="h-10 w-10" />
      </div>
      <h1 className="text-center text-xl font-semibold">ชำระเงินสำเร็จ</h1>
      <p className="max-w-sm text-center text-sm text-muted-foreground">
        ขอบคุณที่ใช้บริการ เราจะติดต่อคุณตามข้อมูลที่กรอกไว้
      </p>
      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link href="/rent">เช่าอื่นต่อ</Link>
        </Button>
        <Button asChild>
          <Link href="/">กลับหน้าหลัก</Link>
        </Button>
      </div>
    </div>
  );
}
