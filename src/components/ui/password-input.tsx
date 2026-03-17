"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function PasswordInput({ label, className, ...props }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={className}>
      {label ? (
        <label className="mb-1.5 block text-sm font-medium" htmlFor={props.id}>
          {label}
        </label>
      ) : null}
      <div className="flex items-center gap-2">
        <Input
          {...props}
          type={visible ? "text" : "password"}
          className="w-full"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background text-xs text-muted-foreground hover:bg-muted"
          aria-label={visible ? "ซ่อนรหัสผ่าน" : "ดูรหัสผ่าน"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

