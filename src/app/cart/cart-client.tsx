"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  type CartItem,
  getLineTotalWithMembership,
  getCartTotalWithMembership,
  type MembershipBenefit,
  resizeInviteEmailsForQty,
} from "@/lib/cart-storage";
import type { MenuProduct } from "@/features/modifier/modifier.repo";
import { updateCartItemAction, updateCartInviteEmailsAction, removeCartItemAction } from "@/features/cart/cart.actions";
import { validateCouponAction } from "@/features/coupon/coupon.actions";
import { ShoppingBag, MapPin, Store, CreditCard, Trash2, Tag, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getVisibleModifiers } from "@/lib/customer-account-credentials";

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

function InviteCartEmailInputs({
  quantity,
  emails,
  onCommit,
}: {
  quantity: number;
  emails: string[];
  onCommit: (next: string[]) => void;
}) {
  const [vals, setVals] = useState<string[]>(() => resizeInviteEmailsForQty(emails, quantity));
  useEffect(() => {
    setVals(resizeInviteEmailsForQty(emails, quantity));
  }, [emails, quantity]);
  return (
    <div className="mt-3 space-y-2 border-t border-border pt-3">
      <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">อีเมลผู้รับลิงก์</p>
      {Array.from({ length: quantity }, (_, j) => (
        <input
          key={j}
          type="email"
          autoComplete="email"
          value={vals[j] ?? ""}
          onChange={(e) => {
            const next = [...vals];
            next[j] = e.target.value;
            setVals(next);
          }}
          onBlur={() => onCommit(resizeInviteEmailsForQty(vals, quantity))}
          className="h-8 w-full rounded-md border border-emerald-200/80 bg-background px-2 text-xs dark:border-emerald-900/50"
          placeholder={`ชิ้นที่ ${j + 1}`}
        />
      ))}
    </div>
  );
}

type Props = {
  menu: MenuProduct[];
  shopName: string;
  /** สิทธิ์สมาชิก (วันเช่าฟรี + ส่วนลด) — ถ้ามีจะแสดงราคาขีดและฟรี/ราคาหลังลด */
  membership?: MembershipBenefit | null;
  /** productId → ส่วนลด % จากโปรโมชัน */
  productDiscountMap?: Record<number, number>;
  /** ตะกร้าจาก DB (โหลดจาก server) */
  initialCart: CartItem[];
};

export function CartClient({ menu, shopName, membership = null, productDiscountMap = {}, initialCart }: Props) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>(initialCart);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    couponId: number;
    discountAmount: number;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  useEffect(() => {
    setCart(initialCart);
  }, [initialCart]);

  async function updateQty(index: number, delta: number) {
    const result = await updateCartItemAction(index, delta);
    if (result.cart) setCart(result.cart);
    router.refresh();
  }

  async function removeFromCart(index: number) {
    const result = await removeCartItemAction(index);
    if (result.cart) setCart(result.cart);
    router.refresh();
  }

  async function saveInviteEmailsForLine(index: number, emails: string[]) {
    const result = await updateCartInviteEmailsAction(index, emails);
    if (result.cart) setCart(result.cart);
    router.refresh();
  }

  const { original: cartTotalOriginal, afterDiscount: cartTotalAfter } =
    getCartTotalWithMembership(cart, membership, productDiscountMap);
  const cartTotal = cartTotalAfter;
  const showDiscountTotal = cartTotalAfter < cartTotalOriginal;

  const couponDiscount = appliedCoupon?.discountAmount ?? 0;
  const finalTotal = Math.max(0, cartTotal - couponDiscount);

  const count = cart.reduce((s, i) => s + i.quantity, 0);

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const result = await validateCouponAction(couponInput, cartTotal);
      if (result.ok && result.discountAmount != null) {
        setAppliedCoupon({
          code: result.couponCode!,
          couponId: result.couponId!,
          discountAmount: result.discountAmount,
        });
      } else {
        setCouponError(result.error ?? "ไม่สามารถใช้ coupon นี้ได้");
      }
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
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
              const totalInCartForProduct = cart
                .filter((c) => c.productId === item.productId)
                .reduce((s, c) => s + c.quantity, 0);
              const maxQtyForLine = product
                ? Math.max(0, product.stock - totalInCartForProduct + item.quantity)
                : item.quantity;
              const canIncrease = item.quantity < maxQtyForLine;
              const imageSrc = product?.imageUrl
                ? `/api/r2-url?key=${encodeURIComponent(product.imageUrl)}`
                : null;
              const promo = productDiscountMap[item.productId ?? 0] ?? 0;
              const line = getLineTotalWithMembership(item, membership, promo);
              const showLineDiscount = line.original !== line.afterDiscount;
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
                      {getVisibleModifiers(item.modifiers).length > 0 && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {getVisibleModifiers(item.modifiers)
                            .map((m) => m.modifierName)
                            .join(", ")}
                        </p>
                      )}
                      {product != null && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          สต็อกคงเหลือ {product.stock}
                          {!canIncrease && " · ถึงจำนวนสูงสุดแล้ว"}
                        </p>
                      )}
                      {(item.productStockType === "invite" || product?.stockType === "invite") && (
                        <InviteCartEmailInputs
                          quantity={item.quantity}
                          emails={item.inviteRecipientEmails ?? []}
                          onCommit={(next) => void saveInviteEmailsForLine(i, next)}
                        />
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
                          onClick={() => canIncrease && updateQty(i, 1)}
                          disabled={!canIncrease}
                          className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                      <div className="w-24 text-right text-sm">
                        {showLineDiscount ? (
                          <>
                            <span className="block text-muted-foreground line-through tabular-nums">{formatMoney(line.original)} ฿</span>
                            {line.isFree ? (
                              <span className="font-semibold text-green-600">ฟรี</span>
                            ) : (
                              <span className="font-semibold tabular-nums">{formatMoney(line.afterDiscount)} ฿</span>
                            )}
                          </>
                        ) : (
                          <span className="font-semibold tabular-nums">{formatMoney(line.original)} ฿</span>
                        )}
                      </div>
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

          <div className="mt-8 rounded-xl border border-border bg-card p-6 space-y-5">
            {/* Coupon Input */}
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                <Tag className="h-4 w-4" /> รหัส Coupon
              </p>
              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-lg border border-green-300 bg-green-50 px-3 py-2 dark:border-green-800 dark:bg-green-950/40">
                  <span className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
                    <Check className="h-4 w-4" />
                    {appliedCoupon.code} (ลด ฿{formatMoney(appliedCoupon.discountAmount)})
                  </span>
                  <button onClick={removeCoupon} className="text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="กรอกรหัส coupon"
                    className="uppercase"
                    onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                    disabled={couponLoading}
                  />
                  <Button onClick={applyCoupon} disabled={couponLoading || !couponInput.trim()} variant="outline" size="sm" className="shrink-0">
                    {couponLoading ? "ตรวจสอบ…" : "ใช้"}
                  </Button>
                </div>
              )}
              {couponError && <p className="mt-1 text-xs text-destructive">{couponError}</p>}
            </div>

            {/* Total breakdown */}
            <div className="space-y-1.5 border-t pt-3">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>ราคารวม</span>
                <span className={showDiscountTotal ? "line-through" : ""}>{formatMoney(cartTotalOriginal)} ฿</span>
              </div>
              {showDiscountTotal && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>หลังส่วนลดสมาชิก/โปร</span>
                  <span>{formatMoney(cartTotal)} ฿</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>ส่วนลด Coupon ({appliedCoupon?.code})</span>
                  <span>-{formatMoney(couponDiscount)} ฿</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t pt-2">
                <span className="font-medium">ยอดที่ต้องชำระ</span>
                <span className="text-2xl font-bold tabular-nums">{formatMoney(finalTotal)} ฿</span>
              </div>
            </div>

            <Button
              className="w-full gap-2 py-6 text-base"
              size="lg"
              asChild
            >
              <Link
                href={`/rent?checkout=1${appliedCoupon ? `&couponId=${appliedCoupon.couponId}&couponCode=${appliedCoupon.code}&couponDiscount=${appliedCoupon.discountAmount}` : ""}`}
              >
                <CreditCard className="h-5 w-5" />
                ดำเนินการชำระเงิน
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
