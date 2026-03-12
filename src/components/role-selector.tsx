"use client";

import { useState } from "react";
import { ROLE_LABELS, type Role } from "@/config/permissions";
import { Button } from "@/components/ui/button";

const FALLBACK_ROLES: Role[] = ["super_admin", "admin", "cashier", "chef"];

type RoleOption = { slug: string; name: string };

type Props = {
  name?: string;
  value?: string[];
  disabled?: boolean;
  className?: string;
  /** จาก DB — ถ้าไม่ส่งจะใช้รายการจาก config */
  roles?: RoleOption[];
};

function getRoleLabel(slug: string, roles?: RoleOption[]): string {
  if (roles) {
    const r = roles.find((x) => x.slug === slug);
    return r?.name ?? slug;
  }
  return ROLE_LABELS[slug as Role] ?? slug;
}

/** เลือก role จาก list กดเพิ่ม/ลบได้ ส่งค่าผ่าน hidden input เป็น comma-separated */
export function RoleSelector({
  name = "roles",
  value = [],
  disabled,
  className,
  roles: rolesProp,
}: Props) {
  const [selected, setSelected] = useState<string[]>(value);
  const roleList = rolesProp?.length
    ? rolesProp.map((r) => r.slug)
    : FALLBACK_ROLES;

  function add(role: string) {
    if (disabled || selected.includes(role)) return;
    setSelected((prev) => [...prev, role]);
  }

  function remove(role: string) {
    if (disabled) return;
    setSelected((prev) => prev.filter((r) => r !== role));
  }

  return (
    <div className={className}>
      <input type="hidden" name={name} value={selected.join(",")} />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">เลือก role:</span>
        {roleList.map((r) => {
          const isSelected = selected.includes(r);
          return (
            <Button
              key={r}
              type="button"
              variant={isSelected ? "secondary" : "outline"}
              size="sm"
              onClick={() => (isSelected ? remove(r) : add(r))}
              disabled={disabled}
            >
              {getRoleLabel(r, rolesProp)}
              {isSelected ? " ✓" : " +"}
            </Button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="text-muted-foreground text-xs">ที่เลือก:</span>
          {selected.map((r) => (
            <span
              key={r}
              className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary"
            >
              {getRoleLabel(r, rolesProp)}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(r)}
                  className="hover:text-destructive -mr-0.5 rounded-full p-0.5 transition-colors"
                  aria-label={`ลบ ${getRoleLabel(r, rolesProp)}`}
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
