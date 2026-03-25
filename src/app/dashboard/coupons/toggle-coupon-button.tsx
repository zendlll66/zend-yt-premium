"use client";

import { Button } from "@/components/ui/button";
import { toggleCouponActiveAction } from "@/features/coupon/coupon.actions";

export function ToggleCouponButton({ id, isActive }: { id: number; isActive: boolean }) {
  return (
    <form action={toggleCouponActiveAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="isActive" value={isActive ? "0" : "1"} />
      <Button type="submit" variant="outline" size="sm">
        {isActive ? "ปิด" : "เปิด"}
      </Button>
    </form>
  );
}
