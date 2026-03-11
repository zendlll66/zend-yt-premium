"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CartItem as CartItemType,
  CART_STORAGE_KEY,
  getDaysForItem,
} from "@/lib/cart-storage";
import type { MenuProduct } from "@/features/modifier/modifier.repo";
import { ShoppingBag, MapPin, Store, CreditCard, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatDateShort(s: string) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

type Props = {
  menu: MenuProduct[];
  shopName: string;
};

export function CartClient({ menu, shopName }: Props) {
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (hydrated) return;
    const ids = new Set(menu.map((p) => p.id));
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItemType[];
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(
            (i) =>
              i &&
              typeof i.rentalStart === "string" &&
              typeof i.rentalEnd === "string" &&
              i.deliveryOption &&
              (i.productId == null || ids.has(i.productId))
          );
          setCart(valid);
        }
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, [hydrated, menu]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [hydrated, cart]);

  function updateQty(index: number, delta: number) {
    setCart((prev) => {
      const next = [...prev];
      const item = next[index];
      const product = menu.find((p) => p.id === item.productId);
      const newQty = item.quantity + delta;
      if (newQty < 1) {
        next.splice(index, 1);
        return next;
      }
      const totalSame = next
        .filter((i) => i.productId === item.productId)
        .reduce((s, i) => s + i.quantity, 0);
      const maxQty = product
        ? Math.max(0, product.stock - totalSame + item.quantity)
        : newQty;
      next[index] = { ...item, quantity: Math.min(newQty, maxQty) };
      return next;
    });
  }

  function removeFromCart(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  const cartTotal =
    cart.length > 0
      ? cart.reduce((sum, item) => {
          const days = getDaysForItem(item.rentalStart, item.rentalEnd);
          return (
            sum +
            (item.price + item.modifiers.reduce((s, m) => s + m.price, 0)) *
              item.quantity *
              days
          );
        }, 0)
      : 0;

  const count = cart.reduce((s, i) => s + i.quantity, 0);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="flex animate-pulse flex-col gap-4">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-32 rounded-xl bg-muted" />
          <div className="h-32 rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">← กลับหน้าหลัก</Link>
        </Button>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          ตะกร้าของฉัน
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {count > 0
            ? `รวม ${count} รายการ`
            : "เพิ่มรายการจากหน้ารายการเช่า"}
        </p>
      </div>

      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 py-16 text-center">
          <ShoppingBag className="mb-4 h-14 w-14 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">ตะกร้าว่าง</p>
          <p className="mt-1 text-sm text-muted-foreground">
            เลือกสินค้าจากหน้ารายการเช่า แล้วเลือกวันรับ–วันคืน และวิธีรับ
          </p>
          <Button className="mt-6" asChild>
            <Link href="/rent">ไปหน้ารายการเช่า</Link>
          </Button>
        </div>
      ) : (
        <>
          <ul className="space-y-4">
            {cart.map((item, i) => {
              const product = menu.find((p) => p.id === item.productId);
              const imageSrc = product?.imageUrl
                ? `/api/r2-url?key=${encodeURIComponent(product.imageUrl)}`
                : null;
              const itemDays = getDaysForItem(item.rentalStart, item.rentalEnd);
              const lineTotal =
                (item.price +
                  item.modifiers.reduce((s, m) => s + m.price, 0)) *
                item.quantity *
                itemDays;
              return (
                <li
                  key={i}
                  className="rounded-xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 flex-1 gap-4">
                      <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
                            <ShoppingBag className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{item.productName}</p>
                      {item.modifiers.length > 0 && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.modifiers.map((m) => m.modifierName).join(", ")}
                        </p>
                      )}
                      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        <span>
                          รับ {formatDateShort(item.rentalStart)} – คืน{" "}
                          {formatDateShort(item.rentalEnd)}
                        </span>
                        <span className="inline-flex items-center gap-0.5">
                          {item.deliveryOption === "pickup" ? (
                            <>
                              <Store className="h-3.5 w-3.5" /> รับที่ร้าน
                            </>
                          ) : (
                            <>
                              <MapPin className="h-3.5 w-3.5" /> ส่ง
                            </>
                          )}
                        </span>
                      </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center rounded-lg border border-border bg-muted/30">
                        <button
                          type="button"
                          onClick={() => updateQty(i, -1)}
                          className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground"
                        >
                          −
                        </button>
                        <span className="flex h-9 min-w-8 items-center justify-center border-x border-border px-2 text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(i, 1)}
                          className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground"
                        >
                          +
                        </button>
                      </div>
                      <span className="w-20 text-right text-sm font-semibold tabular-nums">
                        {formatMoney(lineTotal)} ฿
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(i)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label="ลบรายการ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 rounded-xl border border-border bg-card p-6">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-muted-foreground">รวมทั้งสิ้น</span>
              <span className="text-2xl font-bold tabular-nums">
                {formatMoney(cartTotal)} ฿
              </span>
            </div>
            <Button
              className="w-full gap-2 py-6 text-base"
              size="lg"
              asChild
            >
              <Link href="/rent?checkout=1">
                <CreditCard className="h-5 w-5" />
                ดำเนินการชำระเงิน (Stripe)
              </Link>
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              ระบบจะนำคุณไปหน้ารายการเช่า เพื่อกรอกข้อมูลและชำระเงิน
            </p>
          </div>
        </>
      )}
    </div>
  );
}
