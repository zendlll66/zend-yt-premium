"use client";

import { useState, useActionState } from "react";
import type { SerializedEditorState } from "lexical";
import { createAnnouncementAction } from "@/features/announcement/announcement.actions";
import { Editor } from "@/components/blocks/editor-x/editor-no-ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const selectCls =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export function NewAnnouncementForm() {
  const [content, setContent] = useState("");
  const [state, formAction, pending] = useActionState(createAnnouncementAction, {});

  const handleSerializedChange = (s: SerializedEditorState) => {
    setContent(JSON.stringify(s));
  };

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          ชื่อประกาศ <span className="text-destructive">*</span>
        </label>
        <Input type="text" name="title" placeholder="เช่น ประกาศปิดปรับปรุง" />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">เนื้อหา</label>
        <input type="hidden" name="content" value={content} />
        <Editor onSerializedChange={handleSerializedChange} />
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
  );
}
