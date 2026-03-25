"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { saveLineTemplateAction } from "@/features/support/line-template.actions";
import { LINE_TEMPLATE_VARIABLES } from "@/db/schema/line-message-template.schema";
import type { LineMessageTemplate } from "@/db/schema/line-message-template.schema";
import { CheckCircle2, Loader2, Eye } from "lucide-react";

export function TemplateEditor({ template }: { template: LineMessageTemplate }) {
  const [state, formAction, isPending] = useActionState(saveLineTemplateAction, {});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(template.template);
  const [isEnabled, setIsEnabled] = useState(template.isEnabled);
  const [preview, setPreview] = useState(false);

  /** แทรกตัวแปรที่ตำแหน่ง cursor */
  function insertVariable(varKey: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? text.length;
    const end = ta.selectionEnd ?? text.length;
    const toInsert = `{{${varKey}}}`;
    const newText = text.slice(0, start) + toInsert + text.slice(end);
    setText(newText);
    // restore focus + cursor after insert
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + toInsert.length, start + toInsert.length);
    });
  }

  /** Preview: แทนตัวแปรด้วยตัวอย่าง */
  const previewText = text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const examples: Record<string, string> = {
      customerName: "สมชาย ใจดี",
      ticketId: "42",
      subject: "เข้าใช้งานไม่ได้",
      status: "กำลังแก้ไข",
      orderNumber: "ORD-0001",
      productName: "YouTube Premium 3 เดือน",
      adminNote: "ตรวจสอบและแก้ไขแล้ว",
      shopName: "ร้านของเรา",
      date: new Date().toLocaleDateString("th-TH"),
      time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      year: String(new Date().getFullYear() + 543),
    };
    return examples[key] ?? `{{${key}}}`;
  });

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* header */}
      <div className="border-b bg-muted/40 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{template.name}</p>
          <p className="text-xs text-muted-foreground font-mono">{template.key}</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-xs text-muted-foreground">เปิดส่ง</span>
          <div
            onClick={() => setIsEnabled((v) => !v)}
            className={`relative h-5 w-9 rounded-full transition-colors cursor-pointer ${isEnabled ? "bg-primary" : "bg-muted-foreground/30"}`}
          >
            <div
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isEnabled ? "translate-x-4" : "translate-x-0.5"}`}
            />
          </div>
        </label>
      </div>

      <form action={formAction} className="p-4 space-y-3">
        <input type="hidden" name="id" value={template.id} />
        <input type="hidden" name="template" value={text} />
        <input type="hidden" name="isEnabled" value={isEnabled ? "1" : "0"} />

        {state.success && (
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            บันทึกแล้ว
          </div>
        )}
        {state.error && <p className="text-xs text-destructive">{state.error}</p>}

        {/* Variable chips */}
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">
            คลิกตัวแปรเพื่อแทรกที่ตำแหน่ง cursor:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {LINE_TEMPLATE_VARIABLES.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => insertVariable(v.key)}
                className="inline-flex items-center gap-1 rounded-lg border border-dashed border-primary/50 bg-primary/5 px-2.5 py-1 text-xs font-mono text-primary hover:bg-primary/10 transition"
              >
                <span className="text-primary/50">+</span>
                {`{{${v.key}}}`}
                <span className="text-muted-foreground font-sans not-italic text-[10px]">
                  {v.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Textarea */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium">เนื้อหาข้อความ</p>
            <button
              type="button"
              onClick={() => setPreview((v) => !v)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
            >
              <Eye className="h-3 w-3" />
              {preview ? "แก้ไข" : "Preview"}
            </button>
          </div>
          {preview ? (
            <div className="min-h-[120px] rounded-xl border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
              {previewText}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="พิมข้อความ... คลิกตัวแปรด้านบนเพื่อแทรก {{variable}}"
            />
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            บันทึก
          </Button>
        </div>
      </form>
    </div>
  );
}
