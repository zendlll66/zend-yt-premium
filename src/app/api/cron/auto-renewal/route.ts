import { NextResponse } from "next/server";
import { processAutoRenewalsAction } from "@/features/inventory/auto-renewal.actions";

/** GET /api/cron/auto-renewal
 *  เรียกจาก cron service (เช่น Vercel Cron / GitHub Actions)
 *  ควร set CRON_SECRET และตรวจสอบ Authorization header
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("Authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await processAutoRenewalsAction();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
