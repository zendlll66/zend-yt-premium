"use client";

import { Button } from "@/components/ui/button";
import { deleteCouponAction } from "@/features/coupon/coupon.actions";

export function DeleteCouponButton({ id, code }: { id: number; code: string }) {
  return (
    <form
      action={deleteCouponAction}
      onSubmit={(e) => {
        if (!confirm(`ลบ coupon "${code}" นี้ใช่ไหม?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="destructive" size="sm">
        ลบ
      </Button>
    </form>
  );
}
