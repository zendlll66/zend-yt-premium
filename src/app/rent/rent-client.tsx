"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Calendar,
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
import type { MenuProduct } from "@/features/modifier/modifier.repo";
import type { AddressItem } from "@/features/customer-address/customer-address.repo";

type CartItem = {
  productId: number | null;
  productName: string;
  price: number;
  quantity: number;
  modifiers: { modifierName: string; price: number }[];
};

type Props = {
  menu: MenuProduct[];
  shopName: string;
  shopLogo: string;
  shopDescription?: string | null;
  customer?: { name: string; email: string; phone: string | null } | null;
  addresses?: AddressItem[];
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
  customer,
  addresses = [],
}: Props) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [rentalStart, setRentalStart] = useState("");
  const [rentalEnd, setRentalEnd] = useState("");
  const [customerName, setCustomerName] = useState(customer?.name ?? "");
  const [customerEmail, setCustomerEmail] = useState(customer?.email ?? "");
  const [customerPhone, setCustomerPhone] = useState(customer?.phone ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const categories = getCategories(menu);
  const filteredMenu =
    selectedCategoryId === null
      ? menu
      : menu.filter((p) => (p.categoryId ?? null) === selectedCategoryId);

  const days =
    rentalStart && rentalEnd
      ? Math.max(
          1,
          Math.ceil(
            (new Date(rentalEnd).getTime() - new Date(rentalStart).getTime()) /
              (24 * 60 * 60 * 1000)
          )
        )
      : 1;

  const cartTotal =
    cart.length > 0
      ? cart.reduce(
          (sum, item) =>
            sum +
            (item.price + item.modifiers.reduce((s, m) => s + m.price, 0)) *
              item.quantity *
              days,
          0
        )
      : 0;

  function addToCart(
    product: MenuProduct,
    quantity: number,
    mods: { modifierName: string; price: number }[]
  ) {
    setCart((prev) => {
      const inCart = prev.filter((i) => i.productId === product.id).reduce((s, i) => s + i.quantity, 0);
      const available = Math.max(0, product.stock - inCart);
      const qty = Math.min(quantity, available);
      if (qty < 1) return prev;
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: qty,
          modifiers: mods,
        },
      ];
    });
  }

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
      const totalSame = next.filter((i) => i.productId === item.productId).reduce((s, i) => s + i.quantity, 0);
      const maxQty = product ? Math.max(0, product.stock - totalSame + item.quantity) : newQty;
      next[index] = { ...item, quantity: Math.min(newQty, maxQty) };
      return next;
    });
  }

  function removeFromCart(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCheckout() {
    setError(null);
    if (cart.length === 0) {
      setError("กรุณาเพิ่มรายการในตะกร้า");
      return;
    }
    if (!rentalStart || !rentalEnd) {
      setError("กรุณาเลือกวันที่เริ่มและวันที่คืน");
      return;
    }
    if (new Date(rentalEnd) <= new Date(rentalStart)) {
      setError("วันที่คืนต้องอยู่หลังวันที่เริ่มเช่า");
      return;
    }
    if (!customerName.trim()) {
      setError("กรุณากรอกชื่อ");
      return;
    }
    if (!customerEmail.trim()) {
      setError("กรุณากรอกอีเมล");
      return;
    }

    setSubmitting(true);
    const result = await createRentalOrderAction({
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim() || null,
      rentalStart: new Date(rentalStart),
      rentalEnd: new Date(rentalEnd),
      items: cart,
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
      <div className="sticky top-16 z-20 border-b border-neutral-200/80 bg-white/80 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/80">
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

          {/* วันที่เช่า */}
          <div className="flex flex-1 flex-wrap items-center gap-2 sm:gap-3">
            <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="date"
              value={rentalStart}
              onChange={(e) => setRentalStart(e.target.value)}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 sm:min-w-[132px]"
            />
            <span className="text-muted-foreground">ถึง</span>
            <input
              type="date"
              value={rentalEnd}
              onChange={(e) => setRentalEnd(e.target.value)}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 sm:min-w-[132px]"
            />
            {rentalStart && rentalEnd && days > 0 && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {days} วัน
              </span>
            )}
          </div>

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
                  days={days}
                  availableStock={availableStock}
                  onAdd={(qty, mods) => addToCart(product, qty, mods)}
                />
              );
            })}
          </ul>
        )}

        {error && (
          <div
            className="mt-8 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200"
            role="alert"
          >
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </main>

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
                      เลือกรายการด้านล่างแล้วกดเพิ่มลงตะกร้า
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {cart.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{item.productName}</p>
                          {item.modifiers.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {item.modifiers.map((m) => m.modifierName).join(", ")}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
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
                          <span className="w-20 text-right text-sm font-semibold tabular-nums">
                            {formatMoney(
                              (item.price + item.modifiers.reduce((s, m) => s + m.price, 0)) *
                                item.quantity *
                                days
                            )}{" "}
                            ฿
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFromCart(i)}
                            className="rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                          >
                            ลบ
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="shrink-0 border-t border-neutral-200 p-6 dark:border-neutral-800">
                <div className="mb-4 flex items-center justify-between rounded-2xl bg-neutral-100 px-4 py-3 dark:bg-neutral-800">
                  <span className="text-sm text-muted-foreground">รวม ({days} วัน)</span>
                  <span className="text-xl font-bold tabular-nums">{formatMoney(cartTotal)} ฿</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
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

      {/* Checkout modal */}
      <AnimatePresence>
        {checkoutOpen && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              aria-hidden
              onClick={() => !submitting && setCheckoutOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-neutral-200 bg-white p-8 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
            >
              <h3 className="mb-6 text-xl font-semibold">ข้อมูลผู้เช่า</h3>
              {defaultAddress && (
                <p className="mb-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-muted-foreground dark:border-neutral-700 dark:bg-neutral-800/50">
                  ที่อยู่จัดส่งหลัก: {defaultAddress.recipientName} · {defaultAddress.addressLine1}{" "}
                  {defaultAddress.district} {defaultAddress.province} {defaultAddress.postalCode}
                  <Link href="/account/addresses" className="ml-2 font-medium text-primary hover:underline">
                    แก้ไข
                  </Link>
                </p>
              )}
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">ชื่อ *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none ring-2 ring-transparent focus:border-primary focus:ring-primary/20 dark:border-neutral-700 dark:bg-neutral-800"
                    placeholder="ชื่อ-นามสกุล"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">อีเมล *</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none ring-2 ring-transparent focus:border-primary focus:ring-primary/20 dark:border-neutral-700 dark:bg-neutral-800"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">เบอร์โทร</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none ring-2 ring-transparent focus:border-primary focus:ring-primary/20 dark:border-neutral-700 dark:bg-neutral-800"
                    placeholder="08x-xxx-xxxx"
                  />
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setCheckoutOpen(false)}
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

function ProductCard({
  product,
  days,
  availableStock,
  onAdd,
}: {
  product: MenuProduct;
  days: number;
  availableStock: number;
  onAdd: (quantity: number, modifiers: { modifierName: string; price: number }[]) => void;
}) {
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<Record<number, { id: number; name: string; price: number }>>({});
  const safeQty = Math.min(Math.max(1, qty), availableStock);
  function handleAdd() {
    const requiredMissing = product.modifierGroups.some((g) => g.required && !selected[g.id]);
    if (requiredMissing) {
      alert("กรุณาเลือกตัวเลือกที่บังคับ");
      return;
    }
    if (availableStock < 1) return;
    const mods = product.modifierGroups
      .filter((g) => selected[g.id])
      .map((g) => ({ modifierName: selected[g.id].name, price: selected[g.id].price }));
    onAdd(Math.min(safeQty, availableStock), mods);
  }

  const imageSrc = product.imageUrl
    ? `/api/r2-url?key=${encodeURIComponent(product.imageUrl)}`
    : null;
  const unitPrice = product.price * days;

  return (
    <li className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm shadow-neutral-200/50 transition-all duration-200 hover:shadow-md hover:shadow-neutral-300/40 dark:border-neutral-800/80 dark:bg-neutral-900/50 dark:shadow-neutral-950/50 dark:hover:shadow-neutral-900/60">
      {/* รูปสินค้า */}
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
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {formatMoney(product.price)} ฿
          </span>
          <span className="text-xs text-neutral-400 dark:text-neutral-500">/ วัน</span>
          {days > 1 && (
            <>
              <span className="text-neutral-300 dark:text-neutral-600">·</span>
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {days} วัน {formatMoney(unitPrice)} ฿
              </span>
            </>
          )}
        </div>

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
                          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
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

        <div className="mt-5 flex items-center gap-3">
          <div className="flex items-center overflow-hidden rounded-lg border border-neutral-200/80 dark:border-neutral-700">
            <button
              type="button"
              onClick={() => setQty((n) => Math.max(1, n - 1))}
              className="flex h-9 w-9 items-center justify-center text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
            >
              −
            </button>
            <span className="flex h-9 min-w-9 items-center justify-center border-x border-neutral-200/80 bg-neutral-50/80 px-2 text-sm font-medium text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-200">
              {Math.min(qty, availableStock)}
            </span>
            <button
              type="button"
              onClick={() => setQty((n) => Math.min(availableStock, n + 1))}
              disabled={availableStock < 1}
              className="flex h-9 w-9 items-center justify-center text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-50 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={availableStock < 1}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            เพิ่มลงตะกร้า
          </button>
        </div>
      </div>
    </li>
  );
}
