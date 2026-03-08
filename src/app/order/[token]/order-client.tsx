"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  FolderOpen,
  Receipt,
  ShoppingCart,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { submitTableOrderAction } from "@/features/order/order.actions";
import type { OrderDetail } from "@/features/order/order.repo";
import type { MenuProduct } from "@/features/modifier/modifier.repo";

const DRAWER_DRAG_CLOSE_THRESHOLD = 80;
const DRAWER_VELOCITY_CLOSE = 300;

function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
            aria-hidden
            onClick={onClose}
          />
          <motion.div
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0.2, bottom: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > DRAWER_DRAG_CLOSE_THRESHOLD || info.velocity.y > DRAWER_VELOCITY_CLOSE) {
                onClose();
              }
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 350 }}
            className="fixed inset-x-0 bottom-0 z-40 flex max-h-[88vh] flex-col overflow-hidden rounded-t-3xl border border-b-0 border-border/50 bg-card shadow-[0_-8px_30px_rgba(0,0,0,0.12)]"
          >
            {/* Handle */}
            <div
              className="flex shrink-0 cursor-grab active:cursor-grabbing flex-col items-center pt-3 pb-1 touch-none"
              style={{ touchAction: "none" }}
            >
              <div
                className="h-1 w-14 rounded-full bg-muted-foreground/25"
                aria-hidden
              />
            </div>
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-muted/20 px-5 py-3">
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="ปิด"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Content */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 pb-[env(safe-area-inset-bottom)]">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

type CartItem = {
  productId: number | null;
  productName: string;
  price: number;
  quantity: number;
  modifiers: { modifierName: string; price: number }[];
};

type Props = {
  tableId: number;
  tableNumber: string;
  initialOrder: OrderDetail | null;
  menu: MenuProduct[];
};

function formatMoney(n: number) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function CartItemLine({
  item,
  onQtyChange,
  onRemove,
}: {
  item: CartItem;
  onQtyChange: (delta: number) => void;
  onRemove: () => void;
}) {
  const unit = item.price + item.modifiers.reduce((s, m) => s + m.price, 0);
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border/40 bg-muted/10 px-4 py-3 transition-colors hover:bg-muted/20">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{item.productName}</p>
        {item.modifiers.length > 0 && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {item.modifiers.map((m) => m.modifierName).join(", ")}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center overflow-hidden rounded-xl border border-border/50 bg-background shadow-sm">
          <button
            type="button"
            aria-label="ลดจำนวน"
            onClick={() => onQtyChange(-1)}
            className="flex h-9 w-9 items-center justify-center text-lg font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            −
          </button>
          <span className="flex h-9 min-w-8 items-center justify-center border-x border-border/40 bg-muted/20 px-1 text-sm font-semibold tabular-nums">
            {item.quantity}
          </span>
          <button
            type="button"
            aria-label="เพิ่มจำนวน"
            onClick={() => onQtyChange(1)}
            className="flex h-9 w-9 items-center justify-center text-lg font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            +
          </button>
        </div>
        <span className="w-14 text-right text-sm font-semibold tabular-nums text-foreground">
          {formatMoney(unit * item.quantity)} ฿
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          ลบ
        </button>
      </div>
    </li>
  );
}

type MenuCategory = { id: number | null; name: string };

function getCategoriesFromMenu(menu: MenuProduct[]): MenuCategory[] {
  const seen = new Map<number | null, string>();
  seen.set(null, "ทั้งหมด");
  for (const p of menu) {
    const id = p.categoryId ?? null;
    const name = p.categoryName?.trim() || "ไม่มีหมวด";
    if (!seen.has(id)) seen.set(id, name);
  }
  const all: MenuCategory[] = [{ id: null, name: "ทั้งหมด" }];
  const rest = Array.from(seen.entries())
    .filter(([id]) => id !== null)
    .sort((a, b) => (a[1] || "").localeCompare(b[1] || ""))
    .map(([id, name]) => ({ id, name }));
  return [...all, ...rest];
}

export function OrderClient({ tableId, tableNumber, initialOrder, menu }: Props) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const order = initialOrder;
  const categories = getCategoriesFromMenu(menu);
  const filteredMenu =
    selectedCategoryId === null
      ? menu
      : menu.filter((p) => (p.categoryId ?? null) === selectedCategoryId);

  function addToCart(
    product: MenuProduct,
    quantity: number,
    selectedModifiers: { modifierName: string; price: number }[]
  ) {
    if (quantity < 1) return;
    setCart((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity,
        modifiers: selectedModifiers,
      },
    ]);
  }

  function updateCartQty(index: number, delta: number) {
    setCart((prev) => {
      const next = [...prev];
      const item = next[index];
      const newQty = item.quantity + delta;
      if (newQty < 1) {
        next.splice(index, 1);
        return next;
      }
      next[index] = { ...item, quantity: newQty };
      return next;
    });
  }

  function removeFromCart(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (cart.length === 0) {
      setError("กรุณาเพิ่มรายการก่อนส่งคำสั่ง");
      return;
    }
    setError(null);
    setSubmitting(true);
    const result = await submitTableOrderAction(tableId, cart);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setCart([]);
    setCartOpen(false);
    router.refresh();
  }

  const cartTotal =
    cart.length > 0
      ? cart.reduce(
          (sum, item) =>
            sum +
            (item.price + item.modifiers.reduce((s, m) => s + m.price, 0)) * item.quantity,
          0
        )
      : 0;

  return (
    <div className="min-h-screen bg-linear-to-b from-muted/30 to-background">
      <header className="sticky top-0 z-20 border-b border-border/50 bg-card/95 px-4 py-3.5 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/80">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              โต๊ะ {tableNumber}
            </p>
            <h1 className="mt-0.5 truncate text-xl font-bold tracking-tight text-foreground">
              สั่งอาหาร
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {order && order.items.length > 0 && (
              <button
                type="button"
                onClick={() => setBillOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-muted/30 px-3.5 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/60 active:scale-[0.98]"
              >
                <Receipt className="h-4 w-4" />
                ดูบิล
              </button>
            )}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg active:scale-[0.98]"
            >
              <ShoppingCart className="h-4 w-4" />
              ตะกร้า
              {cart.length > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-foreground/20 px-1.5 text-xs font-bold">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 pb-8 pt-2">
        <section className="rounded-2xl border border-border/40 bg-card p-4 shadow-sm">
          <div className="mb-4 overflow-x-auto pb-1 no-scrollbar">
            <div className="flex gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id ?? "all"}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
                    selectedCategoryId === cat.id
                      ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          <ul className="space-y-3">
            {filteredMenu.length === 0 ? (
              <li className="flex flex-col items-center justify-center py-14 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted/50">
                  <FolderOpen className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">ไม่มีรายการในหมวดนี้</p>
                <p className="mt-1 text-xs text-muted-foreground/80">ลองเลือกหมวดอื่น</p>
              </li>
            ) : (
              filteredMenu.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  onAdd={(qty, mods) => addToCart(product, qty, mods)}
                />
              ))
            )}
          </ul>
        </section>

        {error && (
          <div
            className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}
      </main>

      {/* Drawer ตะกร้า */}
      <Drawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        title={`ตะกร้า (${cart.reduce((s, i) => s + i.quantity, 0)} รายการ)`}
      >
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50">
              <ShoppingCart className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-base font-semibold text-foreground">ตะกร้าว่าง</p>
            <p className="mt-2 max-w-[240px] text-sm text-muted-foreground">
              เลือกเมนูด้านล่าง กด «เพิ่มลงตะกร้า» แล้วกลับมาที่นี่เพื่อส่งคำสั่ง
            </p>
          </div>
        ) : (
          <>
            <ul className="space-y-3">
              {cart.map((item, i) => (
                <CartItemLine
                  key={i}
                  item={item}
                  onQtyChange={(d) => updateCartQty(i, d)}
                  onRemove={() => removeFromCart(i)}
                />
              ))}
            </ul>
            <div className="mt-6 flex flex-col gap-4">
              <div className="flex items-center justify-between rounded-2xl border border-border/40 bg-muted/20 px-5 py-4">
                <span className="text-sm font-medium text-muted-foreground">รวมทั้งสิ้น</span>
                <span className="text-xl font-bold tabular-nums text-foreground">
                  {formatMoney(cartTotal)} ฿
                </span>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full rounded-2xl bg-primary py-4 font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl disabled:opacity-50 active:scale-[0.99]"
              >
                {submitting ? "กำลังส่ง…" : "ส่งคำสั่ง"}
              </button>
            </div>
          </>
        )}
      </Drawer>

      {/* Drawer ดูบิล */}
      <Drawer
        open={billOpen && !!order}
        onClose={() => setBillOpen(false)}
        title={`บิลโต๊ะ ${tableNumber}`}
      >
        {order && (
          <>
            <ul className="space-y-2">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border/40 bg-muted/10 px-4 py-3"
                >
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="font-semibold text-foreground">{item.productName}</span>
                    <span className="text-muted-foreground"> × {item.quantity}</span>
                    {item.modifiers.length > 0 && (
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {item.modifiers.map((m) => m.modifierName).join(", ")}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                    {formatMoney(item.totalPrice)} ฿
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/10 px-5 py-4 text-right">
              <span className="text-sm font-medium text-muted-foreground">รวมบิล </span>
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {formatMoney(order.totalPrice)} ฿
              </span>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}

function ProductRow({
  product,
  onAdd,
}: {
  product: MenuProduct;
  onAdd: (quantity: number, modifiers: { modifierName: string; price: number }[]) => void;
}) {
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<Record<number, { id: number; name: string; price: number }>>({});

  function handleAdd() {
    const requiredMissing = product.modifierGroups.some((g) => g.required && !selected[g.id]);
    if (requiredMissing) {
      alert("กรุณาเลือกตัวเลือกที่บังคับ (เช่น Size)");
      return;
    }
    const mods = product.modifierGroups
      .filter((g) => selected[g.id])
      .map((g) => ({ modifierName: selected[g.id].name, price: selected[g.id].price }));
    onAdd(qty, mods);
  }

  const imageSrc = product.imageUrl
    ? `/api/r2-url?key=${encodeURIComponent(product.imageUrl)}`
    : null;

  return (
    <li className="overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="flex gap-4 p-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border/40 bg-muted/20">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
              <UtensilsCrossed className="h-8 w-8" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{product.name}</p>
          <p className="mt-0.5 text-base font-medium tabular-nums text-primary">
            {formatMoney(product.price)} ฿
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end justify-center gap-2">
          <div className="flex items-center overflow-hidden rounded-xl border border-border/50 bg-muted/30 shadow-inner">
            <button
              type="button"
              aria-label="ลดจำนวน"
              onClick={() => setQty((n) => Math.max(1, n - 1))}
              className="flex h-10 w-10 items-center justify-center text-lg font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted/80"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="h-10 w-11 border-0 bg-transparent text-center text-sm font-medium [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              type="button"
              aria-label="เพิ่มจำนวน"
              onClick={() => setQty((n) => n + 1)}
              className="flex h-10 w-10 items-center justify-center text-lg font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted/80"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="w-full rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            เพิ่มลงตะกร้า
          </button>
        </div>
      </div>
      {product.modifierGroups.length > 0 && (
        <div className="space-y-2 border-t border-border/40 bg-muted/10 px-4 py-3">
          {product.modifierGroups.map((g) => (
            <div key={g.id}>
              <span className="text-xs font-medium text-muted-foreground">
                {g.name}
                {g.required && " *"}
              </span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
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
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      selected[g.id]?.id === m.id
                        ? "border-primary bg-primary/15 text-primary ring-1 ring-primary/20"
                        : "border-border/60 bg-background text-muted-foreground hover:border-border hover:bg-muted/50"
                    }`}
                  >
                    {m.name}
                    {m.price > 0 ? ` +${formatMoney(m.price)}฿` : ""}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </li>
  );
}




