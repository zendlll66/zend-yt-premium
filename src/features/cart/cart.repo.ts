import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { customerCartItems } from "@/db/schema/customer-cart.schema";
import type { CartItem, DeliveryOption } from "@/lib/cart-storage";

function parseModifiers(json: string): { modifierName: string; price: number }[] {
  try {
    const arr = JSON.parse(json || "[]");
    return Array.isArray(arr)
      ? arr.map((m: unknown) =>
          m && typeof m === "object" && "modifierName" in m && "price" in m
            ? { modifierName: String((m as { modifierName: unknown }).modifierName), price: Number((m as { price: unknown }).price) }
            : { modifierName: "", price: 0 }
        )
      : [];
  } catch {
    return [];
  }
}

/** แปลงแถว DB เป็น CartItem */
function rowToCartItem(row: typeof customerCartItems.$inferSelect): CartItem {
  return {
    productId: row.productId,
    productName: row.productName,
    price: row.price,
    quantity: row.quantity,
    modifiers: parseModifiers(row.modifiersJson),
    rentalStart: row.rentalStart,
    rentalEnd: row.rentalEnd,
    deliveryOption: row.deliveryOption as DeliveryOption,
  };
}

export async function getCartByCustomerId(customerId: number): Promise<CartItem[]> {
  const rows = await db
    .select()
    .from(customerCartItems)
    .where(eq(customerCartItems.customerId, customerId))
    .orderBy(asc(customerCartItems.createdAt));
  return rows.map(rowToCartItem);
}

/** จำนวนรายการในตะกร้า (สำหรับแสดงใน Navbar) */
export async function getCartCountByCustomerId(customerId: number): Promise<number> {
  const rows = await db
    .select({ quantity: customerCartItems.quantity })
    .from(customerCartItems)
    .where(eq(customerCartItems.customerId, customerId));
  return rows.reduce((sum, r) => sum + r.quantity, 0);
}

export async function addToCartDb(
  customerId: number,
  item: Omit<CartItem, "productId"> & { productId: number | null }
): Promise<CartItem[]> {
  const modifiersJson = JSON.stringify(item.modifiers ?? []);
  await db.insert(customerCartItems).values({
    customerId,
    productId: item.productId,
    productName: item.productName,
    price: item.price,
    quantity: item.quantity,
    modifiersJson,
    rentalStart: item.rentalStart,
    rentalEnd: item.rentalEnd,
    deliveryOption: item.deliveryOption,
  });
  return getCartByCustomerId(customerId);
}

export async function updateCartItemQtyDb(
  customerId: number,
  index: number,
  delta: number
): Promise<{ cart: CartItem[]; removed: boolean }> {
  const rows = await db
    .select()
    .from(customerCartItems)
    .where(eq(customerCartItems.customerId, customerId))
    .orderBy(asc(customerCartItems.createdAt));
  if (index < 0 || index >= rows.length) return { cart: rows.map(rowToCartItem), removed: false };
  const row = rows[index];
  const newQty = row.quantity + delta;
  if (newQty < 1) {
    await db.delete(customerCartItems).where(eq(customerCartItems.id, row.id));
    const cart = await getCartByCustomerId(customerId);
    return { cart, removed: true };
  }
  await db
    .update(customerCartItems)
    .set({ quantity: newQty })
    .where(eq(customerCartItems.id, row.id));
  const cart = await getCartByCustomerId(customerId);
  return { cart, removed: false };
}

export async function removeCartItemDb(
  customerId: number,
  index: number
): Promise<CartItem[]> {
  const rows = await db
    .select()
    .from(customerCartItems)
    .where(eq(customerCartItems.customerId, customerId))
    .orderBy(asc(customerCartItems.createdAt));
  if (index < 0 || index >= rows.length) return getCartByCustomerId(customerId);
  await db.delete(customerCartItems).where(eq(customerCartItems.id, rows[index].id));
  return getCartByCustomerId(customerId);
}

export async function clearCartDb(customerId: number): Promise<void> {
  await db.delete(customerCartItems).where(eq(customerCartItems.customerId, customerId));
}
