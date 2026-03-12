import { redirect } from "next/navigation";

/** สมัครสมาชิก = เข้าสู่ระบบด้วย LINE (auto register) */
export default function RegisterPage() {
  redirect("/customer-login?from=/account");
}
