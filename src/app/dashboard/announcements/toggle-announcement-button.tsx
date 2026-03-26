"use client";

import { useActionState } from "react";
import { toggleAnnouncementAction } from "@/features/announcement/announcement.actions";
import { Eye, EyeOff } from "lucide-react";

export function ToggleAnnouncementButton({ id, isEnabled }: { id: number; isEnabled: boolean }) {
  const [, formAction, pending] = useActionState(toggleAnnouncementAction, {});
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="isEnabled" value={isEnabled ? "0" : "1"} />
      <button
        type="submit"
        disabled={pending}
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition disabled:opacity-40 ${
          isEnabled
            ? "bg-green-100 text-green-700 hover:bg-green-200"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        }`}
      >
        {isEnabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
        {isEnabled ? "เปิด" : "ปิด"}
      </button>
    </form>
  );
}
