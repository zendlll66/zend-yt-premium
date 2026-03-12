"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteRoleAction } from "@/features/role/role.actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, Trash2, MoreHorizontal } from "lucide-react";
import type { RoleRow } from "@/features/role/role.repo";

const SYSTEM_SLUGS = ["super_admin"];

type Props = { role: RoleRow; userCount: number };

export function RoleRowActions({ role, userCount }: Props) {
  const router = useRouter();
  const isSystem = SYSTEM_SLUGS.includes(role.slug);
  const canDelete = !isSystem && userCount === 0;

  async function handleDelete() {
    if (!canDelete) return;
    if (!confirm(`ลบบทบาท "${role.name}" ใช่หรือไม่?`)) return;
    const result = await deleteRoleAction(role.id);
    if (result.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">เปิดเมนู</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/roles/${role.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            แก้ไข
          </Link>
        </DropdownMenuItem>
        {canDelete ? (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            ลบ
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled className="text-muted-foreground">
            <Trash2 className="mr-2 h-4 w-4" />
            {isSystem ? "ลบไม่ได้ (บทบาทระบบ)" : `ลบไม่ได้ (มีผู้ใช้ ${userCount} คน)`}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
