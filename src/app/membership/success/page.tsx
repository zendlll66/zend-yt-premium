import Link from "next/link";
import { CheckCircle } from "lucide-react";
import Stripe from "stripe";
import { Button } from "@/components/ui/button";
import { activateMembershipAction } from "@/features/membership/membership.actions";

async function activateFromSession(sessionId: string) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return;
  const stripe = new Stripe(secret);
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") return;
    if (session.metadata?.type !== "membership") return;
    const planId = parseInt(session.metadata.planId ?? "", 10);
    const customerId = parseInt(session.metadata.customerId ?? "", 10);
    if (!Number.isFinite(planId) || !Number.isFinite(customerId)) return;
    await activateMembershipAction(customerId, planId);
  } catch {
    // ignore
  }
}

export default async function MembershipSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  if (sessionId) {
    await activateFromSession(sessionId);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-green-600 dark:text-green-400">
        <CheckCircle className="h-10 w-10" />
      </div>
      <h1 className="text-center text-xl font-semibold">สมัครสมาชิกสำเร็จ</h1>
      <p className="max-w-sm text-center text-sm text-muted-foreground">
        คุณสามารถใช้สิทธิ์สมาชิกและส่วนลดได้ทันทีในคำสั่งซื้อถัดไป
      </p>
      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link href="/rent">ไปหน้าสินค้า</Link>
        </Button>
        <Button asChild>
          <Link href="/account/orders">ดูประวัติคำสั่งซื้อ</Link>
        </Button>
      </div>
    </div>
  );
}
