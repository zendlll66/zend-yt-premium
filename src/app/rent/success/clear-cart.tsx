"use client";

import { useEffect } from "react";

const CART_STORAGE_KEY = "zend-rental-cart";

/** เคลียร์ตะกร้าใน localStorage เมื่อชำระเงินสำเร็จแล้ว (โหลดหน้านี้) */
export function ClearCartOnSuccess() {
  useEffect(() => {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);
  return null;
}
