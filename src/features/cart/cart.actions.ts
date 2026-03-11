"use server";

import { revalidatePath } from "next/cache";
import { getCustomerSession } from "@/lib/auth-customer-server";
import type { CartItem } from "@/lib/cart-storage";
import {
  getCartByCustomerId,
  addToCartDb,
  updateCartItemQtyDb,
  removeCartItemDb,
  clearCartDb,
} from "./cart.repo";

export async function getCartAction(): Promise<CartItem[]> {
  const customer = await getCustomerSession();
  if (!customer) return [];
  return getCartByCustomerId(customer.id);
}

export async function addToCartAction(
  item: Omit<CartItem, "productId"> & { productId: number | null }
): Promise<{ error?: string; cart?: CartItem[] }> {
  const customer = await getCustomerSession();
  if (!customer) return { error: "กรุณาเข้าสู่ระบบเพื่อเพิ่มลงตะกร้า" };
  try {
    const cart = await addToCartDb(customer.id, item);
    return { cart };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "เกิดข้อผิดพลาด" };
  }
}

export async function updateCartItemAction(
  index: number,
  delta: number
): Promise<{ error?: string; cart?: CartItem[] }> {
  const customer = await getCustomerSession();
  if (!customer) return { error: "กรุณาเข้าสู่ระบบ" };
  try {
    const { cart } = await updateCartItemQtyDb(customer.id, index, delta);
    revalidatePath("/");
    revalidatePath("/rent");
    revalidatePath("/cart");
    return { cart };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "เกิดข้อผิดพลาด" };
  }
}

export async function removeCartItemAction(
  index: number
): Promise<{ error?: string; cart?: CartItem[] }> {
  const customer = await getCustomerSession();
  if (!customer) return { error: "กรุณาเข้าสู่ระบบ" };
  try {
    const cart = await removeCartItemDb(customer.id, index);
    revalidatePath("/");
    revalidatePath("/rent");
    revalidatePath("/cart");
    return { cart };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "เกิดข้อผิดพลาด" };
  }
}

export async function clearCartAction(): Promise<void> {
  const customer = await getCustomerSession();
  if (!customer) return;
  await clearCartDb(customer.id);
  revalidatePath("/");
  revalidatePath("/rent");
  revalidatePath("/cart");
}
