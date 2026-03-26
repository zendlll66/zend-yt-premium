"use client";

import { useState, useActionState } from "react";
import type { SerializedEditorState } from "lexical";
import { createAnnouncementAction } from "@/features/announcement/announcement.actions";
import { Editor } from "@/components/blocks/editor-x/editor-no-ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WysiwygContent } from "@/components/wysiwyg-content";
import { Eye, EyeOff } from "lucide-react";

const selectCls =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export function NewAnnouncementForm() {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [state, formAction, pending] = useActionState(createAnnouncementAction, {});

  const handleSerializedChange = (s: SerializedEditorState) => {
    setContent(JSON.stringify(s));
  };

  return (
    <div className="max-w-2xl space-y-5">
      {/* Preview Panel */}
      {showPreview && (
        <div className="rounded-2xl border border-brand-border bg-brand-bg p-6 shadow-xl">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-accent" />
            <span className="text-sm font-semibold text-brand-fg">ตัวอย่างประกาศ</span>
          </div>
          <h3 className="mb-2 text-base font-semibold text-brand-fg">{title || "(ยังไม่มีหัวข้อ)"}</h3>
          {content ? (
            <WysiwygContent html={content} className="text-brand-fg/80" />
          ) : (
            <p className="text-sm text-brand-fg/40">(ยังไม่มีเนื้อหา)</p>
          )}
        </div>
      )}

    <form action={formAction} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          ชื่อประกาศ <span className="text-destructive">*</span>
        </label>
        <Input
          type="text"
          name="title"
          placeholder="เช่น ประกาศปิดปรับปรุง"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">เนื้อหา</label>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showPreview ? "ซ่อน Preview" : "ดู Preview"}
          </button>
        </div>
        <input type="hidden" name="content" value={content} />
        <Editor onSerializedChange={handleSerializedChange} imageFolder="announcements" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">วันที่เริ่ม (ไม่บังคับ)</label>
          <Input type="datetime-local" name="startsAt" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">วันที่สิ้นสุด (ไม่บังคับ)</label>
          <Input type="datetime-local" name="endsAt" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">ลำดับการแสดง</label>
          <Input type="number" name="sortOrder" defaultValue={0} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">สถานะ</label>
          <select name="isEnabled" defaultValue="1" className={selectCls}>
            <option value="1">เปิดใช้งาน</option>
            <option value="0">ปิดใช้งาน</option>
          </select>
        </div>
      </div>

      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "กำลังบันทึก..." : "บันทึกประกาศ"}
      </Button>
    </form>
    </div>
  );
}
