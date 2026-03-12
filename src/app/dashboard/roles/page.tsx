import Link from "next/link";
import {
  findAllRoles,
  countAdminsByRole,
} from "@/features/role/role.repo";
import { findPageLabelsByRoleSlug } from "@/features/page-permission/page-permission.repo";
import { Button } from "@/components/ui/button";
import { Shield, Users, Settings, Plus, Pencil, Trash2 } from "lucide-react";
import { RoleRowActions } from "./role-row-actions";

export default async function RolesPage() {
  let roles: Awaited<ReturnType<typeof findAllRoles>> = [];
  try {
    roles = await findAllRoles();
  } catch {
    roles = [];
  }
  const countsAndPages = await Promise.all(
    roles.map(async (r) => ({
      role: r,
      count: await countAdminsByRole(r.slug),
      pageLabels: await findPageLabelsByRoleSlug(r.slug),
    }))
  );

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">จัดการบทบาท (Role Management)</h1>
        <p className="text-sm text-muted-foreground">
          สร้าง แก้ไข ลบบทบาท และดูจำนวนผู้ใช้กับหน้าที่แต่ละบทบาทเข้าได้
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" asChild>
          <Link href="/dashboard/roles/add">
            <Plus className="mr-1.5 h-4 w-4" />
            เพิ่มบทบาท
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/permissions">
            <Settings className="mr-1.5 h-4 w-4" />
            กำหนดสิทธิ์การเข้าถึงหน้า
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/user-list">
            <Users className="mr-1.5 h-4 w-4" />
            รายการผู้ใช้
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 font-medium">บทบาท</th>
                <th className="px-4 py-3 font-medium">slug</th>
                <th className="px-4 py-3 font-medium">จำนวนผู้ใช้</th>
                <th className="px-4 py-3 font-medium">หน้าที่เข้าได้</th>
                <th className="px-4 py-3 text-right font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {countsAndPages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    ยังไม่มีบทบาท (รัน migration 0018_roles ก่อน)
                  </td>
                </tr>
              ) : (
                countsAndPages.map(({ role, count, pageLabels }) => (
                  <tr key={role.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{role.name}</p>
                          {role.description && (
                            <p className="text-xs text-muted-foreground">{role.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{role.slug}</td>
                    <td className="px-4 py-3 tabular-nums">{count} คน</td>
                    <td className="max-w-[200px] px-4 py-3">
                      <span className="line-clamp-2 text-muted-foreground">
                        {pageLabels.length === 0
                          ? "—"
                          : pageLabels.slice(0, 3).join(", ") +
                            (pageLabels.length > 3 ? ` +${pageLabels.length - 3}` : "")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <RoleRowActions role={role} userCount={count} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border bg-muted/30 p-4">
        <h3 className="mb-2 font-medium">วิธีเปลี่ยนบทบาทผู้ใช้</h3>
        <p className="text-sm text-muted-foreground">
          ไปที่ <Link href="/dashboard/user-list" className="font-medium text-primary underline-offset-4 hover:underline">รายการผู้ใช้</Link> แล้วกดแก้ไขผู้ใช้ที่ต้องการ
          เลือกบทบาทจากรายการบทบาทในระบบ (Super Admin ไม่สามารถเปลี่ยนได้)
        </p>
      </div>
    </div>
  );
}
