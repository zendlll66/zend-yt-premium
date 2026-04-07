import { redirect } from "next/navigation";

export default async function WalletPage() {
  redirect("/account/profile");
}
