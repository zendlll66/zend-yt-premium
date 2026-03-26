"use client";

import { useState, useActionState } from "react";
import type { SerializedEditorState } from "lexical";
import { updateAnnouncementAction } from "@/features/announcement/announcement.actions";
import { Editor } from "@/components/blocks/editor-x/editor-no-ssr";
import type { AnnouncementRow } from "@/features/announcement/announcement.repo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const selectCls =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

function toDatetimeLocal(d: Date | null): string {
  if (!d) return "";
  const dt = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

function isLexicalJson(s: string): boolean {
  try {
    const p = JSON.parse(s);
    return p && typeof p === "object" && "root" in p;
  } catch {
    return false;
  }
}

export function EditAnnouncementForm({ announcement }: { announcement: AnnouncementRow }) {
  const [content, setContent] = useState(announcement.content ?? "");
  const [state, formAction, pending] = useActionState(updateAnnouncementAction, {});

  const handleSerializedChange = (s: SerializedEditorState) => {
    setContent(JSON.stringify(s));
  };

  // If stored as Lexical JSON, pass as editorSerializedState; otherwise as initialHtml
  const editorProps = isLexicalJson(content)
    ? { editorSerializedState: JSON.parse(content) as SerializedEditorState }
    : { initialHtml: announcement.content || "" };

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <input type="hidden" name="id" value={announcement.id} />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          ชื่อประกาศ <span className="text-destructive">*</span>
        </label>
        <Input type="text" name="title" defaultValue={announcement.title} placeholder="เช่น ประกาศปิดปรับปรุง" />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">เนื้อหา</label>
        <input type="hidden" name="content" value={content} />
        <Editor {...editorProps} onSerializedChange={handleSerializedChange} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">วันที่เริ่ม (ไม่บังคับ)</label>
          <Input type="datetime-local" name="startsAt" defaultValue={toDatetimeLocal(announcement.startsAt)} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">วันที่สิ้นสุด (ไม่บังคับ)</label>
          <Input type="datetime-local" name="endsAt" defaultValue={toDatetimeLocal(announcement.endsAt)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">ลำดับการแสดง</label>
          <Input type="number" name="sortOrder" defaultValue={announcement.sortOrder} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">สถานะ</label>
          <select
            name="isEnabled"
            defaultValue={announcement.isEnabled ? "1" : "0"}
            className={selectCls}
          >
            <option value="1">เปิดใช้งาน</option>
            <option value="0">ปิดใช้งาน</option>
          </select>
        </div>
      </div>

      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
      </Button>
    </form>
  );
}
