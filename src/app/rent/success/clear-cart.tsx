"use client";

import { useEffect } from "react";
import { clearCartAction } from "@/features/cart/cart.actions";

/** เคลียร์ตะกร้าใน DB เมื่อชำระเงินสำเร็จแล้ว (โหลดหน้านี้) */
export function ClearCartOnSuccess() {
  useEffect(() => {
    clearCartAction();
  }, []);
  return null;
}
