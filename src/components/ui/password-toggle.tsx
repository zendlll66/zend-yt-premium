"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  value: string | null | undefined;
  className?: string;
};

export function PasswordToggle({ value, className }: Props) {
  const [visible, setVisible] = useState(false);
  const v = value ?? "";

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`.trim()}>
      <span className="font-mono text-xs text-muted-foreground">
        {v ? (visible ? v : "••••••••") : "-"}
      </span>
      {v ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setVisible((s) => !s)}
          aria-label={visible ? "ซ่อนรหัสผ่าน" : "ดูรหัสผ่าน"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      ) : null}
    </div>
  );
}

