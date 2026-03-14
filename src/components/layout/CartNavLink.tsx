"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { CART_STORAGE_KEY, CART_UPDATED_EVENT } from "@/lib/cart-storage";

const navLink =
  "rounded-lg px-3 py-2 text-sm font-medium text-brand-fg/85 transition hover:bg-white/10 hover:text-brand-fg";

function getCartCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return 0;
    const cart = JSON.parse(raw);
    if (!Array.isArray(cart)) return 0;
    return cart.reduce((sum: number, item: { quantity?: number }) => sum + (item?.quantity ?? 0), 0);
  } catch {
    return 0;
  }
}

export function CartNavLink() {
  const [count, setCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCount(getCartCount());
    const handler = () => setCount(getCartCount());
    window.addEventListener(CART_UPDATED_EVENT, handler);
    return () => window.removeEventListener(CART_UPDATED_EVENT, handler);
  }, []);

  return (
    <Link href="/cart" className={`${navLink} relative flex items-center gap-1.5`}>
      <ShoppingBag className="h-4 w-4" />
      {mounted && count > 0 && (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-accent px-1 text-[10px] font-bold text-white"
          aria-label={`ตะกร้ามี ${count} รายการ`}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
      <span className="hidden sm:inline">ตะกร้า</span>
    </Link>
  );
}
