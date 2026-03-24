"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createRentalOrderAction } from "@/features/order/order.actions";
import type { CustomerProfile } from "@/features/customer/customer.repo";
import type { MenuProduct } from "@/features/modifier/modifier.repo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CartItem = {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  modifiers: { modifierName: string; price: number }[];
};

type Props = {
  customers: CustomerProfile[];
  menu: MenuProduct[];
};

export function AddOrderClient({ customers, menu }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers.slice(0, 100);
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.lineDisplayName ?? "").toLowerCase().includes(q)
    );
  }, [customers, search]);

  function getInCartQuantity(productId: number): number {
    return cart.reduce((sum, i) => (i.productId === productId ? sum + i.quantity : sum), 0);
  }

  function addToCart(product: MenuProduct, quantity = 1) {
    const inCart = getInCartQuantity(product.id);
    const maxAdd = Math.max(0, product.stock - inCart);
    const add = Math.min(quantity, maxAdd);
    if (add <= 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + add } : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: add,
          modifiers: [],
        },
      ];
    });
  }

  function updateCartQuantity(productId: number, delta: number) {
    const p = menu.find((m) => m.id === productId);
    const maxQty = p ? p.stock : 0;
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.productId !== productId) return i;
          const next = i.quantity + delta;
          const clamped = Math.max(1, Math.min(maxQty, next));
          return { ...i, quantity: clamped };
        })
        .filter((i) => i.quantity > 0)
    );
  }

  function removeFromCart(productId: number) {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }

  const cartTotal = cart.reduce(
    (sum, i) => sum + (i.price + i.modifiers.reduce((s, m) => s + m.price, 0)) * i.quantity,
    0
  );

  async function handleSubmit() {
    if (!selectedCustomer) {
      setError("กรุณาเลือกลูกค้า");
      return;
    }
    if (cart.length === 0) {
      setError("กรุณาเลือกสินค้าอย่างน้อย 1 รายการ");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await createRentalOrderAction({
        customerName: selectedCustomer.name,
        customerEmail: selectedCustomer.email,
        customerPhone: selectedCustomer.phone ?? null,
        customerId: selectedCustomer.id,
        markAsPaid: true,
        items: cart.map((i) => {
          const product = menu.find((m) => m.id === i.productId);
          const inviteRecipientEmails =
            product?.stockType === "invite"
              ? Array.from({ length: i.quantity }, () => selectedCustomer.email.trim())
              : undefined;
          return {
            productId: i.productId,
            productName: i.productName,
            price: i.price,
            quantity: i.quantity,
            modifiers: i.modifiers,
            rentalStart: null,
            rentalEnd: null,
            deliveryOption: null,
            inviteRecipientEmails,
          };
        }),
      });
      if (result.error) {
        setError(result.error);
        setSubmitting(false);
        return;
      }
      if (result.orderId) {
        router.push(`/dashboard/orders/${result.orderId}`);
        router.refresh();
        return;
      }
      setError("สร้างคำสั่งไม่สำเร็จ");
    } catch {
      setError("เกิดข้อผิดพลาด");
    }
    setSubmitting(false);
  }

  return (
    <div className="space-y-6">
      {/* เลือกลูกค้า */}
      <div className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 font-medium">เลือกลูกค้า</h2>
        <Input
          type="search"
          placeholder="ค้นหาชื่อ, อีเมล, LINE..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3 max-w-sm"
        />
        <div className="max-h-60 overflow-y-auto rounded-lg border bg-muted/30">
          {filteredCustomers.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">ไม่พบลูกค้า</p>
          ) : (
            <ul className="divide-y">
              {filteredCustomers.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(c)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-muted/50 ${
                      selectedCustomer?.id === c.id ? "bg-primary/10" : ""
                    }`}
                  >
                    {c.linePictureUrl ? (
                      <img
                        src={c.linePictureUrl.startsWith("http") ? c.linePictureUrl : `/api/r2-url?key=${encodeURIComponent(c.linePictureUrl)}`}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs">
                        {c.name.charAt(0) || "?"}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{c.lineDisplayName ?? c.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                    </div>
                    {selectedCustomer?.id === c.id && (
                      <span className="text-xs text-primary">✓ เลือกแล้ว</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {selectedCustomer && (
          <p className="mt-2 text-sm text-muted-foreground">
            ลูกค้า: <strong>{selectedCustomer.lineDisplayName ?? selectedCustomer.name}</strong> ({selectedCustomer.email})
          </p>
        )}
      </div>

      {/* เลือกสินค้า */}
      <div className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 font-medium">เลือกสินค้า</h2>
        {!selectedCustomer ? (
          <p className="text-sm text-muted-foreground">เลือกลูกคาก่อน</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {menu.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-2 rounded-lg border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.price} ฿ · สต็อก {p.stock}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => addToCart(p)}
                  disabled={p.stock < 1 || getInCartQuantity(p.id) >= p.stock}
                >
                  เพิ่ม
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ตะกร้า */}
      {cart.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <h2 className="mb-3 font-medium">รายการที่เลือก</h2>
          <ul className="space-y-2">
            {cart.map((i) => (
              <li
                key={i.productId}
                className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
              >
                <span className="min-w-0 flex-1 truncate text-sm">{i.productName}</span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => updateCartQuantity(i.productId, -1)}
                  >
                    −
                  </Button>
                  <span className="w-8 text-center text-sm">{i.quantity}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => updateCartQuantity(i.productId, 1)}
                    disabled={
                      (() => {
                        const p = menu.find((m) => m.id === i.productId);
                        return !p || i.quantity >= p.stock;
                      })()
                    }
                  >
                    +
                  </Button>
                </div>
                <span className="w-16 text-right text-sm">
                  {(i.price * i.quantity).toLocaleString("th-TH")} ฿
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => removeFromCart(i.productId)}
                >
                  ลบ
                </Button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-right font-medium">รวม {cartTotal.toLocaleString("th-TH")} ฿</p>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={submitting || !selectedCustomer || cart.length === 0}>
          {submitting ? "กำลังสร้าง…" : "สร้างคำสั่งเช่า"}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/orders">ยกเลิก</Link>
        </Button>
      </div>
    </div>
  );
}
