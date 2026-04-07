import { redirect } from "next/navigation";
export const metadata = { title: "Wallet" };

export default async function TopupPage() {
  redirect("/account/profile");
}
