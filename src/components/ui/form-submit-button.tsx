"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type FormSubmitButtonProps = React.ComponentProps<typeof Button> & {
  /** ข้อความตอนกำลังส่ง (loading) */
  loadingText?: string;
};

/** ปุ่ม submit ใน form — แสดง loading (ข้อความ + spinner) ตอนกำลังส่ง */
export function FormSubmitButton({
  children,
  loadingText = "กำลังโหลด…",
  disabled,
  className,
  ...props
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = disabled ?? pending;

  return (
    <Button type="submit" disabled={isDisabled} className={className} {...props}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" aria-hidden />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
