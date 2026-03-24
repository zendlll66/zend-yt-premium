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
  resizeInviteEmailsForQty,
} from "@/lib/cart-storage";
import {
  addToCartAction,
  clearCartAction,
  updateCartItemAction,
  updateCartInviteEmailsAction,
  removeCartItemAction,
} from "@/features/cart/cart.actions";
import { ImageUpload } from "@/components/image-upload";
import {
  appendCustomerAccountCredentialsModifiers,
  getVisibleModifiers,
} from "@/lib/customer-account-credentials";
import type { StockTypeDescription } from "@/features/stock-type-descriptions/stock-type-descriptions.repo";

type Props = {
  menu: MenuProduct[];
  shopDescription?: string | null;
  /** คำอธิบายแต่ละประเภท stock — ใช้แสดงใน Stepper step 1 ของ modal เลือกแพ็กเกจ */
  stockTypeDescriptions?: StockTypeDescription[];
  customer?: { id: number; name: string; email: string; phone: string | null } | null;
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

function isValidInviteBuyerEmail(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
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
  stockTypeDescriptions = [],
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
    mods: { modifierName: string; price: number }[],
    inviteRecipientEmails?: string[]
  ) {
    if (!customer) {
      router.push("/customer-login?from=" + encodeURIComponent("/rent"));
      return;
    }
    setError(null);
    const inCart = cart.filter((i) => i.productId === product.id).reduce((s, i) => s + i.quantity, 0);
    const maxCanAdd = Math.max(0, product.stock - inCart);
    const qty = Math.min(quantity, maxCanAdd);
    if (qty < 1) return;
    const emails =
      product.stockType === "invite"
        ? resizeInviteEmailsForQty(inviteRecipientEmails ?? [], qty)
        : [];
    const result = await addToCartAction({
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: qty,
      modifiers: mods,
      rentalStart: "",
      rentalEnd: "",
      deliveryOption: "pickup",
      inviteRecipientEmails: emails,
      productStockType: product.stockType,
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

  async function saveInviteEmailsForLine(index: number, emails: string[]) {
    if (!customer) return;
    const result = await updateCartInviteEmailsAction(index, emails);
    if (result.error) {
      setError(result.error);
      return;
    }
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
    for (const item of cart) {
      const stock = item.productStockType ?? menu.find((p) => p.id === item.productId)?.stockType;
      if (stock !== "invite") continue;
      const emails = resizeInviteEmailsForQty(item.inviteRecipientEmails ?? [], item.quantity);
      if (emails.length !== item.quantity || !emails.every((e) => isValidInviteBuyerEmail(e))) {
        setError("กรุณากรอกอีเมลผู้รับลิงก์ให้ครบและถูกต้อง (สินค้า Invite)");
        return;
      }
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
      inviteRecipientEmails: (() => {
        const stock = item.productStockType ?? menu.find((p) => p.id === item.productId)?.stockType;
        if (stock !== "invite") return undefined;
        return resizeInviteEmailsForQty(item.inviteRecipientEmails ?? [], item.quantity);
      })(),
    }));
    const result = await createRentalOrderAction({
      customerName: customer.name.trim(),
      customerEmail: customer.email.trim(),
      customerPhone: customer.phone?.trim() || null,
      customerId: customer.id,
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
              const availableStock = Math.max(0, product.stock);
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
            stockTypeDescription={stockTypeDescriptions.find((d) => d.slug === bookingProduct.stockType) ?? null}
            onClose={() => setBookingProduct(null)}
            onAdd={(qty, mods, opts) => {
              addToCart(bookingProduct, qty, mods, opts?.inviteRecipientEmails);
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
              <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800 sm:px-6 sm:py-4">
                <h2 className="text-base font-semibold sm:text-lg">
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
              <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center sm:py-16">
                    <ShoppingCart className="mb-3 h-10 w-10 text-muted-foreground/40 sm:mb-4 sm:h-12 sm:w-12" />
                    <p className="text-sm text-muted-foreground sm:text-base">ตะกร้าว่าง</p>
                    <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                      กดที่สินค้าเพื่อเลือกแพ็กเกจและเพิ่มลงตะกร้า
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3 sm:space-y-4">
                    {cart.map((item, i) => {
                      const promo = productDiscountMap[item.productId ?? 0] ?? 0;
                      const line = getLineTotalWithMembership(item, membership, promo);
                      const showLineDiscount = line.original !== line.afterDiscount;
                      const product = menu.find((p) => p.id === item.productId);
                      const totalInCartForProduct = cart
                        .filter((c) => c.productId === item.productId)
                        .reduce((s, c) => s + c.quantity, 0);
                      const maxQtyForLine = product
                        ? Math.max(0, product.stock - totalInCartForProduct + item.quantity)
                        : item.quantity;
                      const canIncrease = item.quantity < maxQtyForLine;
                      return (
                        <li
                          key={i}
                          className="rounded-xl border border-neutral-200/80 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800/50 sm:rounded-2xl"
                        >
                          <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4">
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100 sm:text-base">
                                {item.productName}
                              </p>
                              {item.modifiers.length > 0 && (
                                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
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
                              <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
                                แพ็กเกจดิจิทัลพร้อมส่งเข้าบัญชีลูกค้า
                              </p>
                              {(item.productStockType === "invite" || product?.stockType === "invite") && (
                                <InviteCartEmailInputs
                                  quantity={item.quantity}
                                  emails={item.inviteRecipientEmails ?? []}
                                  onCommit={(next) => void saveInviteEmailsForLine(i, next)}
                                />
                              )}
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-3 sm:shrink-0 sm:justify-end">
                              <div className="flex items-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 shadow-inner dark:border-neutral-600 dark:bg-neutral-800/80">
                                <button
                                  type="button"
                                  onClick={() => updateQty(i, -1)}
                                  className="flex h-9 w-9 items-center justify-center text-muted-foreground transition hover:bg-neutral-200 hover:text-foreground dark:hover:bg-neutral-700"
                                >
                                  −
                                </button>
                                <span className="flex h-9 min-w-9 items-center justify-center border-x border-neutral-200 bg-white px-2 text-sm font-semibold tabular-nums dark:border-neutral-600 dark:bg-neutral-900/50">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => canIncrease && updateQty(i, 1)}
                                  disabled={!canIncrease}
                                  className="flex h-9 w-9 items-center justify-center text-muted-foreground transition hover:bg-neutral-200 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-700"
                                >
                                  +
                                </button>
                              </div>
                              <div className="flex min-w-20 items-center justify-end gap-2 sm:w-28 sm:flex-col sm:items-end sm:gap-0.5">
                                {showLineDiscount && (
                                  <span className="text-xs text-muted-foreground line-through tabular-nums">
                                    {formatMoney(line.original)} ฿
                                  </span>
                                )}
                                <span className="text-sm font-semibold tabular-nums sm:text-base">
                                  {line.isFree ? (
                                    <span className="text-emerald-600 dark:text-emerald-400">ฟรี</span>
                                  ) : (
                                    formatMoney(line.afterDiscount) + " ฿"
                                  )}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFromCart(i)}
                                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
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
              <div className="shrink-0 border-t border-neutral-200 p-4 dark:border-neutral-800 sm:p-6">
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
              className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 sm:rounded-3xl"
            >
              <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <h3 className="mb-4 text-lg font-semibold sm:mb-6 sm:text-xl">ดำเนินการชำระเงิน</h3>
              <Stepper
                currentStep={checkoutStep}
                steps={[
                  { id: 1, label: "ตรวจสอบรายการ" },
                  { id: 2, label: "เลือกวิธีชำระเงิน" },
                ]}
              />
              {error && (
                <div
                  className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200 sm:mb-4 sm:rounded-2xl sm:gap-3 sm:px-4 sm:py-3"
                  role="alert"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 sm:h-5 sm:w-5" />
                  <p className="min-w-0">{error}</p>
                </div>
              )}
              {checkoutStep === 1 ? (
                <>
                  <div className="mb-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-800/50 sm:mb-4 sm:rounded-2xl sm:px-4 sm:py-3">
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
                  <div className="mt-6 flex gap-2 sm:mt-8 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setCheckoutOpen(false);
                      }}
                      disabled={submitting}
                      className="flex-1 rounded-xl border border-neutral-200 py-3 font-medium hover:bg-neutral-50 disabled:opacity-50 sm:rounded-2xl sm:py-3.5 dark:border-neutral-700 dark:hover:bg-neutral-800"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckoutStep(2)}
                      disabled={cart.length === 0}
                      className="flex-1 rounded-xl bg-neutral-900 py-3 font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 sm:rounded-2xl sm:py-3.5 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                    >
                      ถัดไป
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mb-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-800/50 sm:mb-4 sm:rounded-2xl sm:px-4 sm:py-3">
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
                  <div className="mb-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-800/50 sm:mb-4 sm:rounded-2xl sm:px-4 sm:py-3">
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
                    <div className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-sm dark:border-neutral-700 dark:bg-neutral-800/50 sm:rounded-2xl sm:px-4">
                      <p className="font-medium">สแกน QR เพื่อชำระเงิน</p>
                      {bankCheckoutData.qrImageUrl ? (
                        <img
                          src={bankCheckoutData.qrImageUrl}
                          alt="QR พร้อมเพย์"
                          className="mx-auto mt-2 h-40 w-40 rounded-lg border bg-white p-2 sm:mt-3 sm:h-52 sm:w-52"
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
                  <div className="mt-6 flex gap-2 sm:mt-8 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setCheckoutStep(1)}
                      disabled={submitting}
                      className="flex-1 rounded-xl border border-neutral-200 py-3 font-medium hover:bg-neutral-50 disabled:opacity-50 sm:rounded-2xl sm:py-3.5 dark:border-neutral-700 dark:hover:bg-neutral-800"
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
                      className="flex-1 rounded-xl bg-neutral-900 py-3 font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 sm:rounded-2xl sm:py-3.5 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
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
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
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
    <div className="mt-3 space-y-2 border-t border-neutral-200/80 pt-3 dark:border-neutral-700">
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

/** Modal เลือกแพ็กเกจ — Step 1: คำอธิบายประเภท, Step 2: รายละเอียดสินค้า, Step 3: ตัวเลือกและจำนวน */
function BookingModal({
  product,
  cart,
  stockTypeDescription,
  onClose,
  onAdd,
  formatMoney,
  discountPercent = 0,
}: {
  product: MenuProduct;
  cart: CartItem[];
  stockTypeDescription: StockTypeDescription | null;
  onClose: () => void;
  onAdd: (
    quantity: number,
    modifiers: { modifierName: string; price: number }[],
    options?: { inviteRecipientEmails?: string[] }
  ) => void;
  formatMoney: (n: number) => string;
  discountPercent?: number;
}) {
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<Record<number, { id: number; name: string; price: number }>>({});
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [customerAccountEmail, setCustomerAccountEmail] = useState("");
  const [customerAccountPassword, setCustomerAccountPassword] = useState("");
  const [customerAccountPasswordConfirm, setCustomerAccountPasswordConfirm] = useState("");

  const inCart = cart.filter((i) => i.productId === product.id).reduce((s, i) => s + i.quantity, 0);
  const maxCanAdd = Math.max(0, product.stock - inCart);
  const displayStock = Math.max(0, product.stock);
  const safeQty = Math.min(Math.max(1, qty), maxCanAdd);
  const effectiveQty = Math.min(safeQty, maxCanAdd);
  const requiredModifiersSelected = !product.modifierGroups.some((g) => g.required && !selected[g.id]);
  const customerAccountValid =
    product.stockType !== "customer_account" ||
    (customerAccountEmail.trim().length > 0 &&
      customerAccountPassword.length > 0 &&
      customerAccountPasswordConfirm.length > 0 &&
      customerAccountPassword === customerAccountPasswordConfirm);
  const inviteEmailsValid =
    product.stockType !== "invite" ||
    (inviteEmails.length === effectiveQty && inviteEmails.every((e) => isValidInviteBuyerEmail(e)));
  const canSubmit = maxCanAdd >= 1 && requiredModifiersSelected && customerAccountValid && inviteEmailsValid;

  useEffect(() => {
    setInviteEmails((prev) => resizeInviteEmailsForQty(prev, effectiveQty));
  }, [effectiveQty]);

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
    const inviteList =
      product.stockType === "invite" ? inviteEmails.map((e) => e.trim()) : undefined;
    onAdd(Math.min(safeQty, maxCanAdd), mods, { inviteRecipientEmails: inviteList });
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
                { id: 1, label: "คำอธิบายประเภท" },
                { id: 2, label: "เลือกแพ็กเกจ" },
                { id: 3, label: "ตัวเลือกและจำนวน" },
              ]}
            />

            {bookingStep === 1 && (
              <div className="space-y-4">
                {stockTypeDescription ? (
                  <>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-1.5 text-xs font-semibold ${stockTypeTone}`}>
                        {stockTypeDescription.name}
                      </span>
                    </div>
                    {stockTypeDescription.imageKey && (
                      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50">
                        <img
                          src={`/api/r2-url?key=${encodeURIComponent(stockTypeDescription.imageKey)}`}
                          alt=""
                          className="h-auto w-full max-h-48 object-contain"
                        />
                      </div>
                    )}
                    {stockTypeDescription.description ? (
                      <div
                        className="prose prose-sm max-w-none rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-muted-foreground dark:border-neutral-700 dark:bg-neutral-800/50 dark:prose-invert prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0"
                        dangerouslySetInnerHTML={{ __html: stockTypeDescription.description }}
                      />
                    ) : (
                      <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-muted-foreground dark:border-neutral-700 dark:bg-neutral-800/50">
                        ประเภทนี้ใช้กับสินค้าที่คุณเลือก — กดถัดไปเพื่อดูรายละเอียดแพ็กเกจ
                      </p>
                    )}
                  </>
                ) : (
                  <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-muted-foreground dark:border-neutral-700 dark:bg-neutral-800/50">
                    ประเภท: {stockTypeLabel} — กดถัดไปเพื่อดูรายละเอียดแพ็กเกจ
                  </p>
                )}
              </div>
            )}

            {bookingStep === 2 && (
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
                  {displayStock > 0
                    ? `สต็อกพร้อมใช้งาน ${displayStock} รายการ`
                    : "สต็อกหมดชั่วคราว กรุณาเลือกรายการอื่น"}
                </p>
              </div>
            )}

            {bookingStep === 3 && (
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
                      {Math.min(qty, maxCanAdd)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty((n) => Math.min(maxCanAdd, n + 1))}
                      disabled={maxCanAdd < 1 || qty >= maxCanAdd}
                      className="flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                  {(() => {
                    const baseUnit = product.price + product.modifierGroups
                      .filter((g) => selected[g.id])
                      .reduce((s, g) => s + (selected[g.id]?.price ?? 0), 0);
                    const unitAfterPromo = baseUnit * (1 - discountPercent / 100);
                    const total = Math.round(unitAfterPromo * Math.min(qty, maxCanAdd));
                    return <span className="text-sm text-muted-foreground">รวม {formatMoney(total)} ฿</span>;
                  })()}
                </div>
                {product.stockType === "invite" && (
                  <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/25">
                    <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
                      อีเมลผู้รับลิงก์ (กรอกตามจำนวนชิ้น)
                    </p>
                    {Array.from({ length: effectiveQty }, (_, j) => (
                      <div key={j}>
                        <label className="text-xs text-muted-foreground">ชิ้นที่ {j + 1}</label>
                        <input
                          type="email"
                          autoComplete="email"
                          value={inviteEmails[j] ?? ""}
                          onChange={(e) => {
                            const next = [...inviteEmails];
                            next[j] = e.target.value;
                            setInviteEmails(next);
                          }}
                          className="mt-0.5 h-9 w-full rounded-md border border-emerald-200 bg-background px-3 text-sm dark:border-emerald-900/50"
                          placeholder="email@example.com"
                        />
                      </div>
                    ))}
                  </div>
                )}
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
                  className="flex-1 rounded-2xl bg-neutral-900 py-3.5 font-semibold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
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
                  onClick={() => setBookingStep(3)}
                  disabled={maxCanAdd < 1}
                  className="flex-1 rounded-2xl bg-neutral-900 py-3.5 font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  ถัดไป
                </button>
              </div>
            )}
            {bookingStep === 3 && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setBookingStep(2)}
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
