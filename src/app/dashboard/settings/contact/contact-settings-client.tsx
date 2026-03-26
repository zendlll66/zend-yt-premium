"use client";

import { useState, useActionState } from "react";
import {
  createContactSocialAction,
  updateContactSocialAction,
  deleteContactSocialAction,
} from "@/features/contact/contact-social.actions";
import { SOCIAL_PLATFORMS } from "@/db/schema/contact-social.schema";
import type { ContactSocialRow } from "@/features/contact/contact-social.repo";
import { SocialIcon } from "@/components/contact/social-icon";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface Props {
  socials: ContactSocialRow[];
}

function getPlatformMeta(key: string) {
  return SOCIAL_PLATFORMS.find((p) => p.key === key) ?? SOCIAL_PLATFORMS[SOCIAL_PLATFORMS.length - 1];
}

const inputCls =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

const selectCls =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

function SocialForm({
  initial,
  action,
  onDone,
}: {
  initial?: ContactSocialRow;
  action: (prev: Record<string, unknown>, fd: FormData) => Promise<{ error?: string; success?: boolean }>;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, { success: false });

  if (state.success) {
    onDone();
    return null;
  }

  return (
    <form action={formAction} className="space-y-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Platform</label>
          <select name="platform" defaultValue={initial?.platform ?? "facebook"} className={selectCls}>
            {SOCIAL_PLATFORMS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            ชื่อที่แสดง <span className="text-destructive">*</span>
          </label>
          <Input
            type="text"
            name="label"
            defaultValue={initial?.label}
            placeholder="เช่น Facebook ร้านเรา"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          URL / เบอร์ / อีเมล <span className="text-destructive">*</span>
        </label>
        <Input
          type="text"
          name="url"
          defaultValue={initial?.url}
          placeholder="https://... หรือ เบอร์โทร / อีเมล"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">ลำดับ</label>
          <Input type="number" name="sortOrder" defaultValue={initial?.sortOrder ?? 0} />
        </div>
        {initial && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">สถานะ</label>
            <select
              name="isEnabled"
              defaultValue={initial.isEnabled ? "1" : "0"}
              className={selectCls}
            >
              <option value="1">เปิดใช้งาน</option>
              <option value="0">ปิดใช้งาน</option>
            </select>
          </div>
        )}
      </div>

      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          ยกเลิก
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
      </div>
    </form>
  );
}

function DeleteButton({ id }: { id: number }) {
  const [, formAction, pending] = useActionState(deleteContactSocialAction, { success: false });
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
        onClick={(e) => {
          if (!confirm("ลบช่องทางติดต่อนี้?")) e.preventDefault();
        }}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  );
}

export function ContactSettingsClient({ socials }: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const editTarget = socials.find((s) => s.id === editId);

  return (
    <div className="space-y-4">
      {/* Add button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowAddForm(true)} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          เพิ่มช่องทาง
        </Button>
      </div>

      {/* Add sheet */}
      <Sheet open={showAddForm} onOpenChange={setShowAddForm}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>เพิ่มช่องทางติดต่อ</SheetTitle>
          </SheetHeader>
          <div className="px-6 pb-6">
            <SocialForm
              action={createContactSocialAction}
              onDone={() => {
                setShowAddForm(false);
                window.location.reload();
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit sheet */}
      <Sheet open={editId !== null} onOpenChange={(o) => !o && setEditId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>แก้ไขช่องทางติดต่อ</SheetTitle>
          </SheetHeader>
          <div className="px-6 pb-6">
            {editTarget && (
              <SocialForm
                initial={editTarget}
                action={updateContactSocialAction}
                onDone={() => {
                  setEditId(null);
                  window.location.reload();
                }}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* List */}
      {socials.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          ยังไม่มีช่องทางติดต่อ กดเพิ่มช่องทางด้านบน
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">ช่องทาง</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">URL</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">ลำดับ</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">สถานะ</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {socials.map((social) => {
                const meta = getPlatformMeta(social.platform);
                return (
                  <tr key={social.id} className="transition hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                          style={{ backgroundColor: meta.color }}
                        >
                          <SocialIcon platform={social.platform} className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{social.label}</p>
                          <p className="text-xs text-muted-foreground">{meta.label}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span className="block max-w-[200px] truncate text-muted-foreground">{social.url}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{social.sortOrder}</td>
                    <td className="px-4 py-3 text-center">
                      {social.isEnabled ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          <Eye className="h-3 w-3" /> เปิด
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          <EyeOff className="h-3 w-3" /> ปิด
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditId(social.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <DeleteButton id={social.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
