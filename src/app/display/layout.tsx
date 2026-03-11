import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-server";

export default async function DisplayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?from=/display");
  }
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {children}
    </div>
  );
}
