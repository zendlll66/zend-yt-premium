import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/auth-customer-server";

/**
 * จุดเข้า LIFF (LINE) — ตั้ง LIFF URL เป็น https://your-domain.com/liff
 * ถ้ายังไม่ login → middleware จะพาไป /customer-login?from=/liff
 * ถ้า login แล้ว → redirect ไปหน้าแรก
 */
export default async function LiffEntryPage() {
  const customer = await getCustomerSession();
  if (!customer) {
    redirect("/customer-login?from=/liff");
  }
  redirect("/");
}
