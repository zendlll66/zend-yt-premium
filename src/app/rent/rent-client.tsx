"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ChevronDown,
  CreditCard,
  Package,
  ShoppingCart,
  X,
  Plus,
  MapPin,
  Store,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { createRentalOrderAction } from "@/features/order/order.actions";
import type { MenuProduct } from "@/features/modifier/modifier.repo";
import type { AddressItem } from "@/features/customer-address/customer-address.repo";
import {
  type CartItem,
  type DeliveryOption,
  getDaysForItem,
  getLineTotalWithMembership,
  getCartTotalWithMembership,
  type MembershipBenefit,
} from "@/lib/cart-storage";
import {
  addToCartAction,
  updateCartItemAction,
  removeCartItemAction,
} from "@/features/cart/cart.actions";

export type { DeliveryOption };

function formatDateShort(s: string) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type Props = {
  menu: MenuProduct[];
  shopName: string;
  shopLogo: string;
  shopDescription?: string | null;
  /** เปิดบริการส่ง — ถ้า false ลูกค้าเลือกรับที่ร้านอย่างเดียว */
  deliveryEnabled?: boolean;
  customer?: { name: string; email: string; phone: string | null } | null;
  addresses?: AddressItem[];
  /** สิทธิ์สมาชิก (วันเช่าฟรี + ส่วนลด) — ถ้ามีจะแสดงราคาขีดและฟรี/ราคาหลังลด */
  membership?: MembershipBenefit | null;
  /** productId → ส่วนลด % จากโปรโมชัน (สำหรับแสดงราคาลดและคำนวณตะกร้า) */
  productDiscountMap?: Record<number, number>;
  /** ตะกร้าจาก DB (เมื่อล็อกอินแล้ว) */
  initialCart?: CartItem[];
};

function formatMoney(n: number) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function getCategories(menu: MenuProduct[]): { id: number | null; name: string }[] {
  const seen = new Map<number | null, string>();
  seen.set(null, "ทั้งหมด");
  for (const p of menu) {
    const id = p.categoryId ?? null;
    const name = (p.categoryName ?? "ไม่มีหมวด").trim();
    if (!seen.has(id)) seen.set(id, name);
  }
  const rest = Array.from(seen.entries())
    .filter(([id]) => id !== null)
    .sort((a, b) => (a[1] || "").localeCompare(b[1] || ""));
  return [{ id: null, name: "ทั้งหมด" }, ...rest.map(([id, name]) => ({ id, name }))];
}

export function RentClient({
  menu,
  shopName,
  shopLogo,
  shopDescription,
  deliveryEnabled = true,
  customer,
  addresses = [],
  membership = null,
  productDiscountMap = {},
  initialCart = [],
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cart, setCart] = useState<CartItem[]>(initialCart);
  const [cartHydrated, setCartHydrated] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [bookingProduct, setBookingProduct] = useState<MenuProduct | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCart(initialCart);
  }, [initialCart]);

  // เปิด modal ชำระเงินเมื่อเข้ามาที่ /rent?checkout=1 และมีรายการในตะกร้า (ต้องล็อกอิน)
  useEffect(() => {
    if (!customer || cart.length === 0) return;
    if (searchParams.get("checkout") === "1") {
      setCheckoutOpen(true);
      setCartOpen(false);
      router.replace("/rent", { scroll: false });
    }
  }, [customer, cart.length, searchParams, router]);

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const categories = getCategories(menu);
  const filteredMenu =
    selectedCategoryId === null
      ? menu
      : menu.filter((p) => (p.categoryId ?? null) === selectedCategoryId);

  const canAddToCart = true; // ไม่ใช้แล้ว (เลือกใน modal)

  const { original: cartTotalOriginal, afterDiscount: cartTotalAfter } =
    getCartTotalWithMembership(cart, membership, productDiscountMap);
  const cartTotal = cartTotalAfter;
  const showDiscountTotal = cartTotalAfter < cartTotalOriginal;

  async function addToCart(
    product: MenuProduct,
    quantity: number,
    mods: { modifierName: string; price: number }[],
    rentalStart: string,
    rentalEnd: string,
    deliveryOption: DeliveryOption
  ) {
    if (!rentalStart || !rentalEnd || new Date(rentalEnd) <= new Date(rentalStart)) {
      setError("กรุณาเลือกวันรับและวันคืนให้ถูกต้อง");
      return;
    }
    if (!customer) {
      router.push("/customer-login?from=" + encodeURIComponent("/rent"));
      return;
    }
    setError(null);
    const inCart = cart.filter((i) => i.productId === product.id).reduce((s, i) => s + i.quantity, 0);
    const available = Math.max(0, product.stock - inCart);
    const qty = Math.min(quantity, available);
    if (qty < 1) return;
    const result = await addToCartAction({
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: qty,
      modifiers: mods,
      rentalStart,
      rentalEnd,
      deliveryOption,
    });
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.cart) setCart(result.cart);
    router.refresh();
  }

  async function updateQty(index: number, delta: number) {
    if (!customer) return;
    const result = await updateCartItemAction(index, delta);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.cart) setCart(result.cart);
    router.refresh();
  }

  async function removeFromCart(index: number) {
    if (!customer) return;
    const result = await removeCartItemAction(index);
    if (result.cart) setCart(result.cart);
    router.refresh();
  }

  async function handleCheckout() {
    setError(null);
    if (!customer) {
      router.push("/customer-login?from=" + encodeURIComponent("/rent?checkout=1"));
      return;
    }
    if (cart.length === 0) {
      setError("กรุณาเพิ่มรายการในตะกร้า");
      return;
    }
    const invalidItem = cart.find(
      (i) =>
        !i.rentalStart ||
        !i.rentalEnd ||
        new Date(i.rentalEnd) <= new Date(i.rentalStart) ||
        !i.deliveryOption
    );
    if (invalidItem) {
      setError("รายการในตะกร้ามีวันรับ/วันคืนไม่ครบ กรุณาลบแล้วเพิ่มใหม่");
      return;
    }

    setSubmitting(true);
    const items = cart.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      price: item.price,
      quantity: item.quantity,
      modifiers: item.modifiers,
      rentalStart: new Date(item.rentalStart),
      rentalEnd: new Date(item.rentalEnd),
      deliveryOption: item.deliveryOption,
    }));
    const result = await createRentalOrderAction({
      customerName: customer.name.trim(),
      customerEmail: customer.email.trim(),
      customerPhone: customer.phone?.trim() || null,
      items,
    });

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    if (!result.orderId) {
      setError("สร้างคำสั่งไม่สำเร็จ");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: result.orderId }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error || "สร้างลิงก์ชำระเงินไม่สำเร็จ");
        setSubmitting(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("เชื่อมต่อไม่สำเร็จ");
      setSubmitting(false);
    }
  }

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const selectedCategoryName =
    categories.find((c) => c.id === selectedCategoryId)?.name ?? "ทั้งหมด";

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* ─── Toolbar: หมวดหมู่ (dropdown) + วันที่ + ตะกร้า ─── */}
      <div className="sticky top-13 z-20 border-b border-neutral-200/80 bg-white/80 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          {/* หมวดหมู่ — dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="min-w-[140px] justify-between gap-2 border-neutral-200 bg-white font-normal dark:border-neutral-700 dark:bg-neutral-900"
              >
                <span className="truncate">{selectedCategoryName}</span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[180px]">
              {categories.map((cat) => (
                <DropdownMenuItem
                  key={cat.id ?? "all"}
                  onClick={() => setSelectedCategoryId(cat.id)}
                >
                  {cat.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <p className="flex-1 text-center text-sm text-muted-foreground">
            กดที่สินค้าเพื่อจอง · เลือกวันรับ–วันคืน และวิธีรับในหน้ารายละเอียด
          </p>

          {/* ตะกร้า */}
          <Button
            type="button"
            size="sm"
            onClick={() => setCartOpen(true)}
            className="relative shrink-0 gap-2 rounded-xl bg-neutral-900 px-4 py-2 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            <ShoppingCart className="h-4 w-4" />
            ตะกร้า
            {cartCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-xs font-bold dark:bg-neutral-800 dark:text-white">
                {cartCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {shopDescription && (
          <p className="mb-8 text-center text-sm text-muted-foreground">{shopDescription}</p>
        )}

        {/* Product grid — cards */}
        {filteredMenu.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Package className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">ไม่มีรายการในหมวดนี้</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredMenu.map((product) => {
              const inCart = cart.filter((i) => i.productId === product.id).reduce((s, i) => s + i.quantity, 0);
              const availableStock = Math.max(0, product.stock - inCart);
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  availableStock={availableStock}
                  discountPercent={productDiscountMap[product.id] ?? 0}
                  onClick={() => setBookingProduct(product)}
                />
              );
            })}
          </ul>
        )}

        {error && !checkoutOpen && (
          <div
            className="mt-8 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
            role="alert"
          >
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </main>

      {/* Modal การจอง — เลือกวันรับ–วันคืน, วิธีรับ, จำนวน แล้วเพิ่มลงตะกร้า */}
      <AnimatePresence>
        {bookingProduct && (
          <BookingModal
            product={bookingProduct}
            cart={cart}
            allowDelivery={deliveryEnabled}
            onClose={() => setBookingProduct(null)}
            onAdd={(rentalStart, rentalEnd, deliveryOption, qty, mods) => {
              addToCart(bookingProduct, qty, mods, rentalStart, rentalEnd, deliveryOption);
              setBookingProduct(null);
            }}
            formatMoney={formatMoney}
            discountPercent={productDiscountMap[bookingProduct.id] ?? 0}
          />
        )}
      </AnimatePresence>

      {/* Cart panel — slide from right on desktop, bottom sheet on mobile */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              aria-hidden
              onClick={() => setCartOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 md:max-w-lg"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
                <h2 className="text-lg font-semibold">
                  ตะกร้า {cartCount > 0 && `(${cartCount})`}
                </h2>
                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  className="rounded-full p-2 text-muted-foreground hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800"
                  aria-label="ปิด"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <ShoppingCart className="mb-4 h-12 w-12 text-muted-foreground/40" />
                    <p className="text-muted-foreground">ตะกร้าว่าง</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      กดที่สินค้าเพื่อเปิดหน้ารายละเอียดและจอง (เลือกวันรับ–วันคืน, วิธีรับ)
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {cart.map((item, i) => {
                      const promo = productDiscountMap[item.productId ?? 0] ?? 0;
                      const line = getLineTotalWithMembership(item, membership, promo);
                      const showLineDiscount = line.original !== line.afterDiscount;
                      return (
                        <li
                          key={i}
                          className="rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold">{item.productName}</p>
                              {item.modifiers.length > 0 && (
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {item.modifiers.map((m) => m.modifierName).join(", ")}
                                </p>
                              )}
                              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                                <span>รับ {formatDateShort(item.rentalStart)} – คืน {formatDateShort(item.rentalEnd)}</span>
                                <span className="inline-flex items-center gap-0.5">
                                  {item.deliveryOption === "pickup" ? (
                                    <><Store className="h-3.5 w-3.5" /> รับที่ร้าน</>
                                  ) : (
                                    <><MapPin className="h-3.5 w-3.5" /> ส่ง</>
                                  )}
                                </span>
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
                                <button
                                  type="button"
                                  onClick={() => updateQty(i, -1)}
                                  className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground"
                                >
                                  −
                                </button>
                                <span className="flex h-9 min-w-8 items-center justify-center border-x border-neutral-200 px-2 text-sm font-medium dark:border-neutral-700">
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
                                className="rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                              >
                                ลบ
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <div className="shrink-0 border-t border-neutral-200 p-6 dark:border-neutral-800">
                <div className="mb-4 flex items-center justify-between rounded-2xl bg-neutral-100 px-4 py-3 dark:bg-neutral-800">
                  <span className="text-sm text-muted-foreground">รวม</span>
                  {showDiscountTotal ? (
                    <span className="flex flex-col items-end gap-0">
                      <span className="text-muted-foreground line-through text-sm tabular-nums">{formatMoney(cartTotalOriginal)} ฿</span>
                      <span className="text-xl font-bold tabular-nums">{formatMoney(cartTotal)} ฿</span>
                    </span>
                  ) : (
                    <span className="text-xl font-bold tabular-nums">{formatMoney(cartTotal)} ฿</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!customer) {
                      router.push("/customer-login?from=" + encodeURIComponent("/rent?checkout=1"));
                      return;
                    }
                    setCartOpen(false);
                    setCheckoutOpen(true);
                  }}
                  disabled={cart.length === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-4 font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  <CreditCard className="h-5 w-5" />
                  ดำเนินการชำระเงิน (Stripe)
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checkout modal — แสดงเฉพาะเมื่อล็อกอินแล้ว ไม่มีฟอร์มกรอกข้อมูล */}
      <AnimatePresence>
        {checkoutOpen && customer && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              aria-hidden
              onClick={() => {
                if (!submitting) {
                  setError(null);
                  setCheckoutOpen(false);
                }
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-neutral-200 bg-white p-8 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
            >
              <h3 className="mb-6 text-xl font-semibold">ดำเนินการชำระเงิน</h3>
              {error && (
                <div
                  className="mb-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
                  role="alert"
                >
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
              <p className="mb-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm dark:border-neutral-700 dark:bg-neutral-800/50">
                <span className="font-medium">{customer.name}</span>
                <br />
                <span className="text-muted-foreground">{customer.email}</span>
                {customer.phone && (
                  <>
                    <br />
                    <span className="text-muted-foreground">{customer.phone}</span>
                  </>
                )}
              </p>
              {defaultAddress && (
                <p className="mb-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-muted-foreground dark:border-neutral-700 dark:bg-neutral-800/50">
                  ที่อยู่จัดส่ง: {defaultAddress.recipientName} · {defaultAddress.addressLine1}{" "}
                  {defaultAddress.district} {defaultAddress.province} {defaultAddress.postalCode}
                  <Link href="/account/addresses" className="ml-2 font-medium text-primary hover:underline">
                    แก้ไข
                  </Link>
                </p>
              )}
              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setCheckoutOpen(false);
                  }}
                  disabled={submitting}
                  className="flex-1 rounded-2xl border border-neutral-200 py-3.5 font-medium hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={submitting}
                  className="flex-1 rounded-2xl bg-neutral-900 py-3.5 font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  {submitting ? "กำลังดำเนินการ…" : "ชำระเงินด้วยบัตร"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Modal การจอง — แสดงรายละเอียดสินค้า, เลือกวันรับ–วันคืน, วิธีรับ, ตัวเลือก, จำนวน แล้วเพิ่มลงตะกร้า */
function BookingModal({
  product,
  cart,
  allowDelivery = true,
  onClose,
  onAdd,
  formatMoney,
  discountPercent = 0,
}: {
  product: MenuProduct;
  cart: CartItem[];
  allowDelivery?: boolean;
  onClose: () => void;
  onAdd: (
    rentalStart: string,
    rentalEnd: string,
    deliveryOption: DeliveryOption,
    quantity: number,
    modifiers: { modifierName: string; price: number }[]
  ) => void;
  formatMoney: (n: number) => string;
  discountPercent?: number;
}) {
  const [rentalStart, setRentalStart] = useState("");
  const [rentalEnd, setRentalEnd] = useState("");
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>("pickup");
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<Record<number, { id: number; name: string; price: number }>>({});

  const inCart = cart.filter((i) => i.productId === product.id).reduce((s, i) => s + i.quantity, 0);
  const availableStock = Math.max(0, product.stock - inCart);
  const safeQty = Math.min(Math.max(1, qty), availableStock);
  const days = rentalStart && rentalEnd ? getDaysForItem(rentalStart, rentalEnd) : 0;
  const canSubmit =
    !!rentalStart &&
    !!rentalEnd &&
    new Date(rentalEnd) > new Date(rentalStart) &&
    availableStock >= 1 &&
    !product.modifierGroups.some((g) => g.required && !selected[g.id]);

  function handleAdd() {
    if (!canSubmit) return;
    const mods = product.modifierGroups
      .filter((g) => selected[g.id])
      .map((g) => ({ modifierName: selected[g.id].name, price: selected[g.id].price }));
    onAdd(rentalStart, rentalEnd, deliveryOption, Math.min(safeQty, availableStock), mods);
  }

  const imageSrc = product.imageUrl
    ? `/api/r2-url?key=${encodeURIComponent(product.imageUrl)}`
    : null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        aria-hidden
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="flex max-h-[90vh] flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
            <h2 className="text-lg font-semibold">การจอง</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800"
              aria-label="ปิด"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            {/* รูป + ชื่อ + ราคา */}
            <div className="flex gap-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
                {imageSrc ? (
                  <img src={imageSrc} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-10 w-10 text-neutral-300 dark:text-neutral-600" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{product.name}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {discountPercent > 0 ? (
                    <>
                      <span className="line-through">{formatMoney(product.price)}</span>
                      {" "}
                      <span className="font-medium text-amber-600 dark:text-amber-400">
                        {formatMoney(Math.round(product.price * (1 - discountPercent / 100)))} ฿/วัน
                      </span>
                    </>
                  ) : (
                    <>{formatMoney(product.price)} ฿/วัน</>
                  )}
                  {" · "}เหลือ {availableStock} ชิ้น
                </p>
              </div>
            </div>

            {/* วันรับ – วันคืน */}
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium">วันรับ – วันคืน</p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={rentalStart}
                  onChange={(e) => setRentalStart(e.target.value)}
                  className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                  title="วันรับ"
                />
                <span className="text-muted-foreground">ถึง</span>
                <input
                  type="date"
                  value={rentalEnd}
                  onChange={(e) => setRentalEnd(e.target.value)}
                  className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                  title="วันคืน"
                />
                {days > 0 && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {days} วัน
                  </span>
                )}
              </div>
            </div>

            {/* วิธีรับ — ถ้าปิดบริการส่ง แสดงเฉพาะรับที่ร้าน */}
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium">วิธีรับสินค้า</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryOption("pickup")}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                    deliveryOption === "pickup"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-neutral-200 bg-white text-muted-foreground hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600"
                  }`}
                >
                  <Store className="h-4 w-4" />
                  รับที่ร้าน
                </button>
                {allowDelivery && (
                  <button
                    type="button"
                    onClick={() => setDeliveryOption("delivery")}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                      deliveryOption === "delivery"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-neutral-200 bg-white text-muted-foreground hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600"
                    }`}
                  >
                    <MapPin className="h-4 w-4" />
                    ส่ง
                  </button>
                )}
              </div>
            </div>

            {/* ตัวเลือกเพิ่ม (modifiers) */}
            {product.modifierGroups.length > 0 && (
              <div className="mt-4 space-y-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                {product.modifierGroups.map((g) => (
                  <div key={g.id}>
                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      {g.name}
                      {g.required && " *"}
                    </span>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {g.modifiers.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() =>
                            setSelected((prev) => ({
                              ...prev,
                              [g.id]: { id: m.id, name: m.name, price: m.price },
                            }))
                          }
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                            selected[g.id]?.id === m.id
                              ? "bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900"
                              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                          }`}
                        >
                          {m.name}
                          {m.price > 0 ? ` +${formatMoney(m.price)}` : ""}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* จำนวน */}
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm font-medium">จำนวน</span>
              <div className="flex items-center overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700">
                <button
                  type="button"
                  onClick={() => setQty((n) => Math.max(1, n - 1))}
                  className="flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  −
                </button>
                <span className="flex h-10 min-w-10 items-center justify-center border-x border-neutral-200 px-2 text-sm font-medium dark:border-neutral-700">
                  {Math.min(qty, availableStock)}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((n) => Math.min(availableStock, n + 1))}
                  disabled={availableStock < 1}
                  className="flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  +
                </button>
              </div>
              {days > 0 && (() => {
                const baseUnit = product.price + product.modifierGroups.filter((g) => selected[g.id]).reduce((s, g) => s + (selected[g.id]?.price ?? 0), 0);
                const unitAfterPromo = baseUnit * (1 - discountPercent / 100);
                const total = Math.round(unitAfterPromo * Math.min(qty, availableStock) * days);
                return (
                  <span className="text-sm text-muted-foreground">
                    รวม {formatMoney(total)} ฿
                  </span>
                );
              })()}
            </div>
          </div>

          <div className="shrink-0 border-t border-neutral-200 p-4 dark:border-neutral-800">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!canSubmit}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-3.5 font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              <Plus className="h-5 w-5" />
              เพิ่มลงตะกร้า
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

/** การ์ดสินค้า — กดเพื่อเปิด Modal การจอง */
function ProductCard({
  product,
  availableStock,
  discountPercent = 0,
  onClick,
}: {
  product: MenuProduct;
  availableStock: number;
  discountPercent?: number;
  onClick: () => void;
}) {
  const imageSrc = product.imageUrl
    ? `/api/r2-url?key=${encodeURIComponent(product.imageUrl)}`
    : null;
  const hasPromo = discountPercent > 0;
  const discountedPrice = hasPromo
    ? Math.round(product.price * (1 - discountPercent / 100))
    : product.price;
  const formatNum = (n: number) =>
    new Intl.NumberFormat("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="group flex w-full flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white text-left shadow-sm shadow-neutral-200/50 transition-all duration-200 hover:shadow-md hover:shadow-neutral-300/40 dark:border-neutral-800/80 dark:bg-neutral-900/50 dark:shadow-neutral-950/50 dark:hover:shadow-neutral-900/60"
      >
        <div className="relative aspect-square overflow-hidden bg-neutral-50 dark:bg-neutral-800/80">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-neutral-200 dark:text-neutral-600">
              <Package className="h-14 w-14" strokeWidth={1} />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-base font-medium tracking-tight text-neutral-900 dark:text-neutral-100">
            {product.name}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            เหลือ {availableStock} ชิ้น
          </p>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            {hasPromo ? (
              <>
                <span className="line-through">{formatNum(product.price)}</span>
                {" "}
                <span className="font-medium text-amber-600 dark:text-amber-400">{formatNum(discountedPrice)} ฿/วัน</span>
              </>
            ) : (
              <>{formatNum(product.price)} ฿/วัน</>
            )}
          </p>
          <p className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
            <Plus className="h-4 w-4" />
            กดเพื่อจอง
          </p>
        </div>
      </button>
    </li>
  );
}
