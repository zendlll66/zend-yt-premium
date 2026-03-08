"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitTableOrderAction } from "@/features/order/order.actions";
import type { OrderDetail } from "@/features/order/order.repo";
import type { MenuProduct } from "@/features/modifier/modifier.repo";

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

export function OrderClient({ tableId, tableNumber, initialOrder, menu }: Props) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const order = initialOrder;

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
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card px-4 py-3">
        <h1 className="text-lg font-semibold">โต๊ะ {tableNumber}</h1>
        <p className="text-muted-foreground text-sm">สแกน QR เพื่อสั่งอาหาร — บิลรวมกับโต๊ะนี้</p>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 p-4">
        {order && order.items.length > 0 && (
          <section className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 font-medium">รายการที่สั่งแล้ว (บิลนี้)</h2>
            <ul className="space-y-2 text-sm">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>
                    {item.productName} × {item.quantity}
                    {item.modifiers.length > 0 && (
                      <span className="ml-1 text-muted-foreground">
                        ({item.modifiers.map((m) => m.modifierName).join(", ")})
                      </span>
                    )}
                  </span>
                  <span>{formatMoney(item.totalPrice)} ฿</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 border-t pt-2 text-right font-medium">
              รวมบิล {formatMoney(order.totalPrice)} ฿
            </p>
          </section>
        )}

        <section className="rounded-xl border bg-card p-4">
          <h2 className="mb-3 font-medium">เมนู</h2>
          <ul className="space-y-4">
            {menu.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                onAdd={(qty, mods) => addToCart(product, qty, mods)}
              />
            ))}
          </ul>
        </section>

        {cart.length > 0 && (
          <section className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 font-medium">รายการที่กำลังสั่ง</h2>
            <ul className="space-y-2 text-sm">
              {cart.map((item, i) => (
                <li key={i} className="flex items-center justify-between gap-2">
                  <span>
                    {item.productName} × {item.quantity}
                    {item.modifiers.length > 0 && (
                      <span className="ml-1 text-muted-foreground">
                        ({item.modifiers.map((m) => m.modifierName).join(", ")})
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <span>{formatMoney((item.price + item.modifiers.reduce((s, m) => s + m.price, 0)) * item.quantity)} ฿</span>
                    <button
                      type="button"
                      onClick={() => removeFromCart(i)}
                      className="text-destructive text-xs underline"
                    >
                      ลบ
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-4 w-full rounded-lg bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? "กำลังส่ง…" : "ส่งคำสั่ง"}
            </button>
          </section>
        )}

        {error && (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </main>
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

  return (
    <li className="flex flex-col gap-2 border-b pb-4 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{product.name}</p>
          <p className="text-muted-foreground text-sm">{formatMoney(product.price)} ฿</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(parseInt(e.target.value, 10) || 1)}
            className="w-14 rounded border border-input bg-background px-2 py-1 text-center text-sm"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            เพิ่ม
          </button>
        </div>
      </div>
      {product.modifierGroups.length > 0 && (
        <div className="space-y-1.5 pl-2 text-sm">
          {product.modifierGroups.map((g) => (
            <div key={g.id}>
              <span className="text-muted-foreground">
                {g.name}
                {g.required && " *"}
              </span>
              <div className="mt-1 flex flex-wrap gap-1">
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
                    className={`rounded border px-2 py-1 text-xs ${selected[g.id]?.id === m.id ? "border-primary bg-primary/10 text-primary" : "border-input bg-muted/30"}`}
                  >
                    {m.name}
                    {m.price > 0 ? ` +${m.price}฿` : ""}
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
