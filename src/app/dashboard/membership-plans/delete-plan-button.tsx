"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteMembershipPlanAction } from "@/features/membership/membership.actions";

export function DeletePlanButton({ planId }: { planId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("ต้องการลบแผนสมาชิกนี้ใช่หรือไม่?")) return;
    setLoading(true);
    const res = await deleteMembershipPlanAction(planId);
    setLoading(false);
    if (res.error) {
      alert(res.error);
    } else {
      router.refresh();
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={handleDelete}
      disabled={loading}
      aria-label="ลบแผน"
    >
      <Trash2 className="h-4 w-4" />
      {loading ? "กำลังลบ…" : "ลบ"}
    </Button>
  );
}
