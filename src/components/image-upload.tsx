"use client";

import * as React from "react";
import { uploadImageAction, deleteImageAction } from "@/app/actions/upload";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ImageUploadProps = {
  /** โฟลเดอร์ใน R2 เช่น "products" */
  folder: string;
  /** คีย์ที่เก็บใน R2 (หรือค่าว่าง) */
  value: string;
  /** เรียกเมื่ออัปโหลดสำเร็จหรือลบรูป (ส่ง key หรือ "") */
  onChange: (key: string) => void;
  /** name สำหรับ hidden input ใน form (เช่น "image_url") */
  name?: string;
  /** ปิดการใช้งาน */
  disabled?: boolean;
  className?: string;
};

export function ImageUpload({
  folder,
  value,
  onChange,
  name,
  disabled,
  className,
}: ImageUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const imageSrc = value
    ? `/api/r2-url?key=${encodeURIComponent(value)}`
    : null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || disabled || loading) return;
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("folder", folder);
      const result = await uploadImageAction(formData);
      if (result.key) {
        if (value) await deleteImageAction(value);
        onChange(result.key);
      } else {
        setError(result.error ?? "อัปโหลดไม่สำเร็จ");
      }
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    if (!value || disabled || loading) return;
    setError(null);
    setLoading(true);
    try {
      await deleteImageAction(value);
      onChange("");
    } catch {
      setError("ลบรูปไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {name && <input type="hidden" name={name} value={value} readOnly />}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        {imageSrc ? (
          <div className="relative inline-block">
            <img
              src={imageSrc}
              alt="Preview"
              className="h-24 w-24 rounded-lg border object-cover"
            />
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -right-1 -top-1 h-6 w-6 rounded-full p-0"
                onClick={handleRemove}
                disabled={loading}
              >
                ×
              </Button>
            )}
          </div>
        ) : (
          <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-muted/50 text-muted-foreground transition-colors hover:bg-muted">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={disabled || loading}
              onChange={handleFileChange}
            />
            <span className="text-xs">
              {loading ? "กำลังอัป…" : "เลือกรูป"}
            </span>
          </label>
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
