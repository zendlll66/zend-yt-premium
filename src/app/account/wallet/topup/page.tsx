import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { getShopSettings } from "@/features/settings/settings.repo";
import { TopupClient } from "./topup-client";

export const metadata = { title: "เติม Wallet" };

export default async function TopupPage() {
  const customer = await getCustomerSession();
  if (!customer) redirect("/customer-login?from=/account/wallet/topup");

  const shop = await getShopSettings();
  const stripeEnabled = shop.paymentStripeEnabled === "1";
  const bankEnabled = shop.paymentBankEnabled === "1";

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">เติม Wallet</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          เลือกจำนวนเงินและวิธีชำระ เงินจะเข้า Wallet ทันทีหลังชำระสำเร็จ
        </p>
      </div>
      <TopupClient stripeEnabled={stripeEnabled} bankEnabled={bankEnabled} />
    </div>
  );
}
