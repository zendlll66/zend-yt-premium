"use client";

import { useActionState } from "react";
import { deleteAnnouncementAction } from "@/features/announcement/announcement.actions";
import { Trash2 } from "lucide-react";

export function DeleteAnnouncementButton({ id }: { id: number }) {
  const [, formAction, pending] = useActionState(deleteAnnouncementAction, {});
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
        onClick={(e) => {
          if (!confirm("ลบประกาศนี้?")) e.preventDefault();
        }}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  );
}
