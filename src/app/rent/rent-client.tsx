"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  CreditCard,
  Package,
  ShoppingCart,
  X,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { createRentalOrderAction } from "@/features/order/order.actions";
import { submitOrderBankSlipAction } from "@/features/order/order.actions";
import type { MenuProduct } from "@/features/modifier/modifier.repo";
import {
  type CartItem,
  getLineTotalWithMembership,
  getCartTotalWithMembership,
  type MembershipBenefit,
} from "@/lib/cart-storage";
import {
  addToCartAction,
  clearCartAction,
  updateCartItemAction,
  removeCartItemAction,
} from "@/features/cart/cart.actions";
import { ImageUpload } from "@/components/image-upload";
import {
  appendCustomerAccountCredentialsModifiers,
  getVisibleModifiers,
} from "@/lib/customer-account-credentials";

type Props = {
  menu: MenuProduct[];
  shopDescription?: string | null;
  customer?: { name: string; email: string; phone: string | null } | null;
  /** สิทธิ์สมาชิก (วันเช่าฟรี + ส่วนลด) — ถ้ามีจะแสดงราคาขีดและฟรี/ราคาหลังลด */
  membership?: MembershipBenefit | null;
  /** productId → ส่วนลด % จากโปรโมชัน (สำหรับแสดงราคาลดและคำนวณตะกร้า) */
  productDiscountMap?: Record<number, number>;
  /** ตะกร้าจาก DB (เมื่อล็อกอินแล้ว) */
  initialCart?: CartItem[];
  paymentOptions?: {
    stripeEnabled: boolean;
    bankEnabled: boolean;
    bankName?: string;
    bankAccountName?: string;
    bankAccountNumber?: string;
  };
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

function getStockTypeLabel(stockType: MenuProduct["stockType"]): string {
  switch (stockType) {
    case "individual":
      return "Individual";
    case "family":
      return "Family";
    case "invite":
      return "Invite Link";
    case "customer_account":
      return "Customer Account";
    default:
      return stockType;
  }
}

function getStockTypes(menu: MenuProduct[]): { id: MenuProduct["stockType"] | null; name: string }[] {
  const seen = new Set<MenuProduct["stockType"]>();
  for (const p of menu) {
    seen.add(p.stockType);
  }
  const order: MenuProduct["stockType"][] = ["individual", "family", "invite", "customer_account"];
  return [
    { id: null, name: "Stock ทั้งหมด" },
    ...order.filter((t) => seen.has(t)).map((t) => ({ id: t, name: getStockTypeLabel(t) })),
  ];
}

function Stepper({
  steps,
  currentStep,
}: {
  steps: { id: number; label: string }[];
  currentStep: number;
}) {
  return (
    <div className="mb-5 flex items-center gap-2">
      {steps.map((step, idx) => {
        const isDone = currentStep > step.id;
        const isActive = currentStep === step.id;
        return (
          <div key={step.id} className="flex min-w-0 flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                isDone
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : isActive
                    ? "border-primary bg-primary text-white"
                    : "border-neutral-300 bg-white text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
              }`}
            >
              {isDone ? <Check className="h-3.5 w-3.5" /> : step.id}
            </div>
            <span
              className={`truncate text-xs font-medium ${
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
            {idx < steps.length - 1 && (
              <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function RentClient({
  menu,
  shopDescription,
  customer,
  membership = null,
  productDiscountMap = {},
  initialCart = [],
  paymentOptions = { stripeEnabled: true, bankEnabled: false },
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cart, setCart] = useState<CartItem[]>(initialCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [bookingProduct, setBookingProduct] = useState<MenuProduct | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedStockType, setSelectedStockType] = useState<MenuProduct["stockType"] | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"stripe" | "bank">(
    paymentOptions.bankEnabled ? "bank" : "stripe"
  );
  const [bankCheckoutData, setBankCheckoutData] = useState<{
    orderId: number;
    amount: number;
    qrImageUrl: string | null;
    bankName?: string;
    bankAccountName?: string;
    bankAccountNumber?: string;
    promptPayId?: string;
  } | null>(null);
  const [bankSlipImageKey, setBankSlipImageKey] = useState("");
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
      setCheckoutStep(1);
      setSelectedPaymentMethod(paymentOptions.bankEnabled ? "bank" : "stripe");
      setBankCheckoutData(null);
      setBankSlipImageKey("");
      setCartOpen(false);
      router.replace("/rent", { scroll: false });
    }
  }, [customer, cart.length, searchParams, router, paymentOptions.bankEnabled]);

  useEffect(() => {
    // กันกรณีช่องทางที่เลือกถูกปิดใน settings ภายหลัง
    if (selectedPaymentMethod === "stripe" && !paymentOptions.stripeEnabled && paymentOptions.bankEnabled) {
      setSelectedPaymentMethod("bank");
    } else if (selectedPaymentMethod === "bank" && !paymentOptions.bankEnabled && paymentOptions.stripeEnabled) {
      setSelectedPaymentMethod("stripe");
    }
  }, [selectedPaymentMethod, paymentOptions.stripeEnabled, paymentOptions.bankEnabled]);

  const categories = getCategories(menu);
  const stockTypes = getStockTypes(menu);
  const filteredMenu = menu.filter((p) => {
    const passCategory = selectedCategoryId === null || (p.categoryId ?? null) === selectedCategoryId;
    const passStockType = selectedStockType === null || p.stockType === selectedStockType;
    return passCategory && passStockType;
  });

  const { original: cartTotalOriginal, afterDiscount: cartTotalAfter } =
    getCartTotalWithMembership(cart, membership, productDiscountMap);
  const cartTotal = cartTotalAfter;
  const showDiscountTotal = cartTotalAfter < cartTotalOriginal;

  async function addToCart(
    product: MenuProduct,
    quantity: number,
    mods: { modifierName: string; price: number }[]
  ) {
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
      rentalStart: "",
      rentalEnd: "",
      deliveryOption: "pickup",
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
    if (!paymentOptions.stripeEnabled && !paymentOptions.bankEnabled) {
      setError("ร้านค้ายังไม่ได้เปิดช่องทางชำระเงิน");
      return;
    }
    if (!customer) {
      router.push("/customer-login?from=" + encodeURIComponent("/rent?checkout=1"));
      return;
    }
    if (cart.length === 0) {
      setError("กรุณาเพิ่มรายการในตะกร้า");
      return;
    }
    setSubmitting(true);
    setBankCheckoutData(null);
    setBankSlipImageKey("");
    const items = cart.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      price: item.price,
      quantity: item.quantity,
      modifiers: item.modifiers,
      rentalStart: null,
      rentalEnd: null,
      deliveryOption: null,
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
        body: JSON.stringify({ orderId: result.orderId, paymentMethod: selectedPaymentMethod }),
      });
      const data = (await res.json()) as {
        orderId?: number;
        url?: string;
        error?: string;
        paymentMethod?: "stripe" | "bank";
        amount?: number;
        qrImageUrl?: string | null;
        bankName?: string;
        bankAccountName?: string;
        bankAccountNumber?: string;
        promptPayId?: string;
      };
      if (!res.ok) {
        setError(data.error || "สร้างลิงก์ชำระเงินไม่สำเร็จ");
        setSubmitting(false);
        return;
      }
      if (selectedPaymentMethod === "stripe") {
        if (!data.url) {
          setError("สร้างลิงก์ชำระเงินไม่สำเร็จ");
          setSubmitting(false);
          return;
        }
        window.location.href = data.url;
        return;
      }
      setBankCheckoutData({
        orderId: data.orderId ?? result.orderId,
        amount: data.amount ?? cartTotal,
        qrImageUrl: data.qrImageUrl ?? null,
        bankName: data.bankName,
        bankAccountName: data.bankAccountName,
        bankAccountNumber: data.bankAccountNumber,
        promptPayId: data.promptPayId,
      });
      setSubmitting(false);
    } catch {
      setError("เชื่อมต่อไม่สำเร็จ");
      setSubmitting(false);
    }
  }

  async function handleSubmitBankSlip() {
    if (!bankCheckoutData?.orderId) {
      setError("ไม่พบคำสั่งซื้อสำหรับอัปโหลดสลิป");
      return;
    }
    if (!bankSlipImageKey.trim()) {
      setError("กรุณาอัปโหลดสลิปก่อนแจ้งชำระเงิน");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await submitOrderBankSlipAction(bankCheckoutData.orderId, bankSlipImageKey);
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    await clearCartAction();
    setCart([]);
    setCheckoutOpen(false);
    setBankCheckoutData(null);
    setBankSlipImageKey("");
    setSubmitting(false);
    router.push(`/account/orders/${bankCheckoutData.orderId}`);
    router.refresh();
  }

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const selectedCategoryName =
    categories.find((c) => c.id === selectedCategoryId)?.name ?? "ทั้งหมด";
  const selectedStockTypeName =
    stockTypes.find((s) => s.id === selectedStockType)?.name ?? "Stock ทั้งหมด";

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* ─── Toolbar: หมวดหมู่ + stock type + ตะกร้า ─── */}
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

          {/* stock type — dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="min-w-[160px] justify-between gap-2 border-neutral-200 bg-white font-normal dark:border-neutral-700 dark:bg-neutral-900"
              >
                <span className="truncate">{selectedStockTypeName}</span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[190px]">
              {stockTypes.map((type) => (
                <DropdownMenuItem
                  key={type.id ?? "all"}
                  onClick={() => setSelectedStockType(type.id)}
                >
                  {type.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <p className="flex-1 text-center text-sm text-muted-foreground">
            กดที่สินค้าเพื่อเลือกแพ็กเกจและเพิ่มลงตะกร้า
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

      {/* Modal เลือกแพ็กเกจ — ตัวเลือกเสริม + จำนวน แล้วเพิ่มลงตะกร้า */}
      <AnimatePresence>
        {bookingProduct && (
          <BookingModal
            product={bookingProduct}
            cart={cart}
            onClose={() => setBookingProduct(null)}
            onAdd={(qty, mods) => {
              addToCart(bookingProduct, qty, mods);
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
                      กดที่สินค้าเพื่อเลือกแพ็กเกจและเพิ่มลงตะกร้า
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
                                  {getVisibleModifiers(item.modifiers)
                                    .map((m) => m.modifierName)
                                    .join(", ")}
                                </p>
                              )}
                              <p className="mt-2 text-xs text-muted-foreground">
                                แพ็กเกจดิจิทัลพร้อมส่งเข้าบัญชีลูกค้า
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
                    setCheckoutStep(1);
                    setBankCheckoutData(null);
                    setBankSlipImageKey("");
                    setCheckoutOpen(true);
                  }}
                  disabled={cart.length === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-4 font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  <CreditCard className="h-5 w-5" />
                  ดำเนินการชำระเงิน
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
              <Stepper
                currentStep={checkoutStep}
                steps={[
                  { id: 1, label: "ตรวจสอบรายการ" },
                  { id: 2, label: "เลือกวิธีชำระเงิน" },
                ]}
              />
              {error && (
                <div
                  className="mb-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
                  role="alert"
                >
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
              {checkoutStep === 1 ? (
                <>
                  <div className="mb-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm dark:border-neutral-700 dark:bg-neutral-800/50">
                    <p className="font-medium">สรุปรายการในตะกร้า ({cartCount} ชิ้น)</p>
                    <ul className="mt-2 space-y-1 text-muted-foreground">
                      {cart.slice(0, 4).map((item, idx) => (
                        <li key={`${item.productId}-${idx}`} className="flex items-center justify-between gap-2">
                          <span className="truncate">{item.productName}</span>
                          <span className="shrink-0">x{item.quantity}</span>
                        </li>
                      ))}
                      {cart.length > 4 && <li>... และอีก {cart.length - 4} รายการ</li>}
                    </ul>
                    <p className="mt-3 text-right font-semibold text-foreground">รวม {formatMoney(cartTotal)} ฿</p>
                  </div>
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
                      onClick={() => setCheckoutStep(2)}
                      disabled={cart.length === 0}
                      className="flex-1 rounded-2xl bg-neutral-900 py-3.5 font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                    >
                      ถัดไป
                    </button>
                  </div>
                </>
              ) : (
                <>
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
                  <div className="mb-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm dark:border-neutral-700 dark:bg-neutral-800/50">
                    <p className="mb-2 font-medium">เลือกวิธีชำระเงิน</p>
                    <div className="space-y-2">
                      <label className={`flex items-center gap-2 ${paymentOptions.stripeEnabled ? "cursor-pointer" : "opacity-60"}`}>
                        <input
                          type="radio"
                          name="payment-method"
                          checked={selectedPaymentMethod === "stripe"}
                          disabled={!paymentOptions.stripeEnabled}
                          onChange={() => {
                            setSelectedPaymentMethod("stripe");
                            setBankCheckoutData(null);
                            setBankSlipImageKey("");
                          }}
                        />
                        <span>Stripe (บัตรเครดิต/เดบิต)</span>
                        {!paymentOptions.stripeEnabled && (
                          <span className="text-xs text-muted-foreground">(ยังไม่เปิดใช้งาน)</span>
                        )}
                      </label>
                      <label className={`flex items-center gap-2 ${paymentOptions.bankEnabled ? "cursor-pointer" : "opacity-60"}`}>
                        <input
                          type="radio"
                          name="payment-method"
                          checked={selectedPaymentMethod === "bank"}
                          disabled={!paymentOptions.bankEnabled}
                          onChange={() => {
                            setSelectedPaymentMethod("bank");
                            setBankCheckoutData(null);
                            setBankSlipImageKey("");
                          }}
                        />
                        <span>โอนธนาคาร / QR</span>
                        {!paymentOptions.bankEnabled && (
                          <span className="text-xs text-muted-foreground">(ยังไม่เปิดใช้งาน)</span>
                        )}
                      </label>
                    </div>
                    {!paymentOptions.stripeEnabled && !paymentOptions.bankEnabled && (
                      <p className="mt-2 text-xs text-destructive">
                        ร้านค้ายังไม่ได้เปิดช่องทางชำระเงิน กรุณาติดต่อแอดมิน
                      </p>
                    )}
                  </div>

                  {selectedPaymentMethod === "bank" && bankCheckoutData && (
                    <div className="mb-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm dark:border-neutral-700 dark:bg-neutral-800/50">
                      <p className="font-medium">สแกน QR เพื่อชำระเงิน</p>
                      {bankCheckoutData.qrImageUrl ? (
                        <img
                          src={bankCheckoutData.qrImageUrl}
                          alt="QR พร้อมเพย์"
                          className="mx-auto mt-3 h-52 w-52 rounded-lg border bg-white p-2"
                        />
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground">
                          ยังไม่ได้ตั้งค่า PromptPay ID จึงไม่สามารถสร้าง QR ได้
                        </p>
                      )}
                      <div className="mt-3 space-y-1 text-muted-foreground">
                        {bankCheckoutData.bankName && <p>ธนาคาร: {bankCheckoutData.bankName}</p>}
                        {bankCheckoutData.bankAccountName && (
                          <p>ชื่อบัญชี: {bankCheckoutData.bankAccountName}</p>
                        )}
                        {bankCheckoutData.bankAccountNumber && (
                          <p>เลขบัญชี: {bankCheckoutData.bankAccountNumber}</p>
                        )}
                        <p className="font-semibold text-foreground">
                          ยอดที่ต้องชำระ: {formatMoney(bankCheckoutData.amount)} ฿
                        </p>
                      </div>
                      <div className="mt-4 border-t border-neutral-200 pt-3 dark:border-neutral-700">
                        <p className="mb-2 font-medium text-foreground">อัปโหลดสลิปการโอน</p>
                        <ImageUpload
                          folder="payment-slips"
                          value={bankSlipImageKey}
                          onChange={setBankSlipImageKey}
                          disabled={submitting}
                        />
                        <p className="mt-2 text-xs text-muted-foreground">
                          หลังอัปโหลดสลิป ระบบจะส่งคำสั่งซื้อไปสถานะรอตรวจสอบ (wait)
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="mt-8 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCheckoutStep(1)}
                      disabled={submitting}
                      className="flex-1 rounded-2xl border border-neutral-200 py-3.5 font-medium hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                    >
                      ย้อนกลับ
                    </button>
                    <button
                      type="button"
                      onClick={
                        selectedPaymentMethod === "bank" && bankCheckoutData
                          ? handleSubmitBankSlip
                          : handleCheckout
                      }
                      disabled={
                        submitting ||
                        (selectedPaymentMethod === "bank" &&
                          bankCheckoutData != null &&
                          !bankSlipImageKey.trim()) ||
                        (!paymentOptions.stripeEnabled && !paymentOptions.bankEnabled)
                      }
                      className="flex-1 rounded-2xl bg-neutral-900 py-3.5 font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                    >
                      {submitting
                        ? "กำลังดำเนินการ…"
                        : selectedPaymentMethod === "stripe"
                          ? "ไปหน้าชำระเงิน Stripe"
                          : bankCheckoutData
                            ? "ส่งสลิปเพื่อรอตรวจสอบ"
                          : "สร้าง QR ชำระเงิน"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Modal เลือกแพ็กเกจ — แสดงรายละเอียดสินค้า, ตัวเลือก, จำนวน แล้วเพิ่มลงตะกร้า */
function BookingModal({
  product,
  cart,
  onClose,
  onAdd,
  formatMoney,
  discountPercent = 0,
}: {
  product: MenuProduct;
  cart: CartItem[];
  onClose: () => void;
  onAdd: (quantity: number, modifiers: { modifierName: string; price: number }[]) => void;
  formatMoney: (n: number) => string;
  discountPercent?: number;
}) {
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<Record<number, { id: number; name: string; price: number }>>({});
  const [bookingStep, setBookingStep] = useState<1 | 2>(1);
  const [customerAccountEmail, setCustomerAccountEmail] = useState("");
  const [customerAccountPassword, setCustomerAccountPassword] = useState("");
  const [customerAccountPasswordConfirm, setCustomerAccountPasswordConfirm] = useState("");

  const inCart = cart.filter((i) => i.productId === product.id).reduce((s, i) => s + i.quantity, 0);
  const availableStock = Math.max(0, product.stock - inCart);
  const safeQty = Math.min(Math.max(1, qty), availableStock);
  const requiredModifiersSelected = !product.modifierGroups.some((g) => g.required && !selected[g.id]);
  const customerAccountValid =
    product.stockType !== "customer_account" ||
    (customerAccountEmail.trim().length > 0 &&
      customerAccountPassword.length > 0 &&
      customerAccountPasswordConfirm.length > 0 &&
      customerAccountPassword === customerAccountPasswordConfirm);
  const canSubmit = availableStock >= 1 && requiredModifiersSelected && customerAccountValid;

  function handleAdd() {
    if (!canSubmit) return;
    let mods = product.modifierGroups
      .filter((g) => selected[g.id])
      .map((g) => ({ modifierName: selected[g.id].name, price: selected[g.id].price }));
    if (product.stockType === "customer_account") {
      mods = appendCustomerAccountCredentialsModifiers(
        mods,
        customerAccountEmail.trim(),
        customerAccountPassword
      );
    }
    onAdd(Math.min(safeQty, availableStock), mods);
  }

  const imageSrc = product.imageUrl
    ? `/api/r2-url?key=${encodeURIComponent(product.imageUrl)}`
    : null;
  const stockTypeLabel = getStockTypeLabel(product.stockType);
  const stockTypeTone = (() => {
    switch (product.stockType) {
      case "individual":
        return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300";
      case "family":
        return "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300";
      case "invite":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
      case "customer_account":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
      default:
        return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
    }
  })();

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
            <h2 className="text-lg font-semibold">เลือกแพ็กเกจ</h2>
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
            <Stepper
              currentStep={bookingStep}
              steps={[
                { id: 1, label: "เลือกแพ็กเกจ" },
                { id: 2, label: "ตัวเลือกและจำนวน" },
              ]}
            />

            {bookingStep === 1 && (
              <div className="space-y-4">
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
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${stockTypeTone}`}>
                        {stockTypeLabel}
                      </span>
                      {product.categoryName && (
                        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                          {product.categoryName}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{product.name}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {discountPercent > 0 ? (
                        <>
                          <span className="line-through">{formatMoney(product.price)}</span>
                          {" "}
                          <span className="font-medium text-amber-600 dark:text-amber-400">
                            {formatMoney(Math.round(product.price * (1 - discountPercent / 100)))} ฿
                          </span>
                        </>
                      ) : (
                        <>{formatMoney(product.price)} ฿</>
                      )}
                    </p>
                  </div>
                </div>
                <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-muted-foreground dark:border-neutral-700 dark:bg-neutral-800/50">
                  {availableStock > 0
                    ? `สต็อกพร้อมใช้งาน ${availableStock} รายการ`
                    : "สต็อกหมดชั่วคราว กรุณาเลือกรายการอื่น"}
                </p>
              </div>
            )}

            {bookingStep === 2 && (
              <div className="space-y-4">
                {product.modifierGroups.length > 0 && (
                  <div className="space-y-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
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

                <div className="flex items-center gap-3">
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
                  {(() => {
                    const baseUnit = product.price + product.modifierGroups
                      .filter((g) => selected[g.id])
                      .reduce((s, g) => s + (selected[g.id]?.price ?? 0), 0);
                    const unitAfterPromo = baseUnit * (1 - discountPercent / 100);
                    const total = Math.round(unitAfterPromo * Math.min(qty, availableStock));
                    return <span className="text-sm text-muted-foreground">รวม {formatMoney(total)} ฿</span>;
                  })()}
                </div>
                {product.stockType === "customer_account" && (
                  <div className="space-y-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/50">
                    <p className="text-sm font-medium">กรอกบัญชีที่ต้องการให้ร้านดำเนินการ</p>
                    <input
                      type="email"
                      value={customerAccountEmail}
                      onChange={(e) => setCustomerAccountEmail(e.target.value)}
                      placeholder="Email"
                      className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                      required
                    />
                    <input
                      type="password"
                      value={customerAccountPassword}
                      onChange={(e) => setCustomerAccountPassword(e.target.value)}
                      placeholder="Password"
                      className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                      required
                    />
                    <input
                      type="password"
                      value={customerAccountPasswordConfirm}
                      onChange={(e) => setCustomerAccountPasswordConfirm(e.target.value)}
                      placeholder="ยืนยัน Password"
                      className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                      required
                    />
                    {customerAccountPasswordConfirm.length > 0 &&
                      customerAccountPassword !== customerAccountPasswordConfirm && (
                        <p className="text-xs text-destructive">รหัสผ่านไม่ตรงกัน</p>
                      )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-neutral-200 p-4 dark:border-neutral-800">
            {bookingStep === 1 && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-2xl border border-neutral-200 py-3.5 font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => setBookingStep(2)}
                  disabled={availableStock < 1}
                  className="flex-1 rounded-2xl bg-neutral-900 py-3.5 font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  ถัดไป
                </button>
              </div>
            )}
            {bookingStep === 2 && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setBookingStep(1)}
                  className="flex-1 rounded-2xl border border-neutral-200 py-3.5 font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!canSubmit}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-3.5 font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  <Plus className="h-5 w-5" />
                  เพิ่มลงตะกร้า
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

/** การ์ดสินค้า — กดเพื่อเปิด Modal เลือกแพ็กเกจ */
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
  const stockTypeLabel = getStockTypeLabel(product.stockType);
  const stockTypeTone = (() => {
    switch (product.stockType) {
      case "individual":
        return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300";
      case "family":
        return "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300";
      case "invite":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
      case "customer_account":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
      default:
        return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
    }
  })();
  const stockText = (() => {
    if (product.stockType === "customer_account") return "ลูกค้าส่งบัญชีให้ร้านดำเนินการ";
    if (product.stockType === "family") return `คงเหลือ ${availableStock} ที่นั่ง`;
    if (product.stockType === "invite") return `คงเหลือ ${availableStock} ลิงก์`;
    return `คงเหลือ ${availableStock} บัญชี`;
  })();

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="group flex w-full flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white text-left shadow-sm shadow-neutral-200/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-neutral-300/40 dark:border-neutral-800/80 dark:bg-neutral-900/50 dark:shadow-neutral-950/50 dark:hover:shadow-neutral-900/60"
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
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${stockTypeTone}`}>
              {stockTypeLabel}
            </span>
            {product.categoryName && (
              <span className="rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-medium text-white">
                {product.categoryName}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-base font-medium tracking-tight text-neutral-900 dark:text-neutral-100">
            {product.name}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {stockText}
          </p>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            {hasPromo ? (
              <>
                <span className="line-through">{formatNum(product.price)}</span>
                {" "}
                <span className="font-medium text-amber-600 dark:text-amber-400">{formatNum(discountedPrice)} ฿</span>
              </>
            ) : (
              <>{formatNum(product.price)} ฿</>
            )}
          </p>
          <p className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
            <Plus className="h-4 w-4" />
            กดเพื่อเลือกแพ็กเกจ
          </p>
        </div>
      </button>
    </li>
  );
}
