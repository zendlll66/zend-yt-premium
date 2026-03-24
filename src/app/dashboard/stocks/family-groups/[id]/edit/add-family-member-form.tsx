"use client";

import { useState } from "react";
import { addFamilyMemberAction } from "@/features/youtube/youtube-stock.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { PasswordInput } from "@/components/ui/password-input";

type Mode = "credentials" | "invite";

export function AddFamilyMemberForm({ familyGroupId }: { familyGroupId: number }) {
  const [mode, setMode] = useState<Mode>("credentials");

  return (
    <form action={addFamilyMemberAction} className="max-w-2xl space-y-3 rounded-lg border bg-card p-4">
      <input type="hidden" name="family_group_id" value={familyGroupId} />
      <input type="hidden" name="add_member_mode" value={mode} />

      <p className="text-sm font-medium">เพิ่มสมาชิกในคลัง (ช่องว่างในกลุ่ม)</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "credentials" ? "default" : "outline"}
          onClick={() => setMode("credentials")}
        >
          อีเมล + รหัสผ่าน
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "invite" ? "default" : "outline"}
          onClick={() => setMode("invite")}
        >
          ลิงก์เชิญ
        </Button>
      </div>

      {mode === "credentials" ? (
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[180px] flex-1 space-y-1">
            <label className="text-xs text-muted-foreground" htmlFor="add-member-email">
              อีเมลสมาชิก
            </label>
            <Input
              id="add-member-email"
              name="email"
              placeholder="อีเมลสมาชิกใหม่"
              required
              autoComplete="off"
            />
          </div>
          <div className="min-w-[180px] flex-1">
            <PasswordInput
              name="member_password"
              label="รหัสผ่าน"
              placeholder="รหัสผ่านสมาชิก"
              required
              autoComplete="new-password"
            />
          </div>
          <FormSubmitButton size="sm" loadingText="กำลังเพิ่ม…" className="shrink-0">
            เพิ่มสมาชิก
          </FormSubmitButton>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground" htmlFor="add-member-invite">
              ลิงก์เชิญ (URL) *
            </label>
            <Input
              id="add-member-invite"
              name="invite_link"
              placeholder="วางลิงก์เชิญ (URL)"
              required
              autoComplete="off"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground" htmlFor="add-member-label">
              ชื่อเรียกในตาราง (ไม่บังคับ)
            </label>
            <Input
              id="add-member-label"
              name="slot_label"
              placeholder="เช่น ช่อง 1 — ถ้าว่างจะแสดงเป็น (ลิงก์เชิญ)"
              autoComplete="off"
            />
          </div>
          <FormSubmitButton size="sm" loadingText="กำลังเพิ่ม…">
            เพิ่มช่องลิงก์เชิญ
          </FormSubmitButton>
        </div>
      )}
    </form>
  );
}
