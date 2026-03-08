"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { canAccess } from "@/config/permissions";
import { Button } from "@/components/ui/button";

type Props = {
  user: { role: string };
  children: React.ReactNode;
};

export function PermissionGuard({ user, children }: Props) {
  const pathname = usePathname();
  const allowed = canAccess(pathname ?? "", user.role);

  if (!allowed) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <h2 className="text-lg font-semibold">ไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
        <p className="text-muted-foreground text-sm">
          บทบาทของคุณไม่สามารถเข้าใช้งานหน้านี้ได้
        </p>
        <Button asChild>
          <Link href="/dashboard">กลับไปแดชบอร์ด</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
