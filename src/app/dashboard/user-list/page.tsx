import Link from "next/link";
import { findAllAdmins } from "@/features/admin/admin.repo";
import { Button } from "@/components/ui/button";
import { UserRowActions } from "./user-row-actions";

function formatDate(d: Date | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function roleBadge(role: string) {
  if (role === "super_admin") {
    return (
      <span className="inline-flex rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
        Super Admin
      </span>
    );
  }
  const map: Record<string, string> = {
    admin: "bg-primary/20 text-primary",
    cashier: "bg-muted text-muted-foreground",
    chef: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
  };
  const label = role === "admin" ? "แอดมิน" : role === "cashier" ? "แคชเชียร์" : "เชฟ";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${map[role] ?? "bg-muted"}`}
    >
      {label}
    </span>
  );
}

export default async function UserListPage() {
  const users = await findAllAdmins();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">รายการผู้ใช้</h1>
        <Button asChild>
          <Link href="/dashboard/user-list/add">เพิ่มผู้ใช้</Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 font-medium">ชื่อ</th>
                <th className="px-4 py-3 font-medium">อีเมล</th>
                <th className="px-4 py-3 font-medium">บทบาท</th>
                <th className="px-4 py-3 font-medium">สร้างเมื่อ</th>
                <th className="px-4 py-3 font-medium text-right">จัดการ</th>
              </tr>
            </thead> 
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    ยังไม่มีผู้ใช้
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">{roleBadge(u.role)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <UserRowActions id={u.id} role={u.role} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
