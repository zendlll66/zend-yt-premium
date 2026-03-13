"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { deleteFromR2 } from "@/lib/r2";
import type { ProductStockType } from "@/db/schema/product.schema";
import {
  findProductById,
  createProduct,
  updateProduct,
  deleteProductById,
  setProductActive,
} from "./product.repo";

export type CreateProductState = { error?: string };
export type UpdateProductState = { error?: string };

function parseNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseStockType(v: unknown): ProductStockType | null {
  const value = String(v ?? "").trim();
  if (
    value === "individual" ||
    value === "family" ||
    value === "invite" ||
    value === "customer_account"
  ) {
    return value;
  }
  return null;
}

export async function createProductAction(
  _prev: CreateProductState,
  formData: FormData
): Promise<CreateProductState> {
  const name = (formData.get("name") as string)?.trim() ?? "";
  const categoryId = parseNum(formData.get("category_id"));
  const price = parseNum(formData.get("price")) ?? 0;
  const deposit = parseNum(formData.get("deposit"));
  const cost = parseNum(formData.get("cost"));
  const stockType = parseStockType(formData.get("stock_type"));
  const description = (formData.get("description") as string)?.trim() || null;
  const sku = (formData.get("sku") as string)?.trim() || null;
  const barcode = (formData.get("barcode") as string)?.trim() || null;
  const imageUrl = (formData.get("image_url") as string)?.trim() || null;
  const isActive = formData.has("is_active") ? formData.get("is_active") === "1" : true;

  if (!name) return { error: "กรุณากรอกชื่อสินค้า" };
  if (price < 0) return { error: "ราคาต้องไม่ต่ำกว่า 0" };
  if (!stockType) return { error: "กรุณาเลือกประเภทสต็อก" };

  const product = await createProduct({
    name,
    categoryId: categoryId ?? null,
    price,
    deposit: deposit ?? null,
    cost: cost ?? null,
    stockType,
    description,
    sku,
    barcode,
    imageUrl,
    isActive,
  });

  if (!product) return { error: "สร้างสินค้าไม่สำเร็จ" };
  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function updateProductAction(
  _prev: UpdateProductState,
  formData: FormData
): Promise<UpdateProductState> {
  const id = parseNum(formData.get("id")) ?? 0;
  const name = (formData.get("name") as string)?.trim() ?? "";
  const categoryId = parseNum(formData.get("category_id"));
  const price = parseNum(formData.get("price")) ?? 0;
  const deposit = parseNum(formData.get("deposit"));
  const cost = parseNum(formData.get("cost"));
  const stockType = parseStockType(formData.get("stock_type"));
  const description = (formData.get("description") as string)?.trim() || null;
  const sku = (formData.get("sku") as string)?.trim() || null;
  const barcode = (formData.get("barcode") as string)?.trim() || null;
  const imageUrl = (formData.get("image_url") as string)?.trim() || null;
  const isActive = formData.get("is_active") === "1";

  if (!id || !name) return { error: "กรุณากรอกชื่อสินค้า" };
  if (price < 0) return { error: "ราคาต้องไม่ต่ำกว่า 0" };
  if (!stockType) return { error: "กรุณาเลือกประเภทสต็อก" };

  const existing = await findProductById(id);
  if (!existing) return { error: "ไม่พบสินค้า" };

  const product = await updateProduct(id, {
    name,
    categoryId: categoryId ?? null,
    price,
    deposit: deposit ?? null,
    cost: cost ?? null,
    stockType,
    description,
    sku,
    barcode,
    imageUrl,
    isActive,
  });

  if (!product) return { error: "อัปเดตไม่สำเร็จ" };
  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function deleteProductAction(id: number): Promise<{ error?: string }> {
  const product = await findProductById(id);
  if (!product) return { error: "ไม่พบสินค้า" };

  if (product.imageUrl) {
    await deleteFromR2(product.imageUrl);
  }

  const ok = await deleteProductById(id);
  revalidatePath("/dashboard/products");
  if (!ok) return { error: "ลบไม่สำเร็จ" };
  return {};
}

export async function toggleProductActiveAction(
  id: number,
  isActive: boolean
): Promise<{ error?: string }> {
  const product = await findProductById(id);
  if (!product) return { error: "ไม่พบสินค้า" };

  await setProductActive(id, isActive);
  revalidatePath("/dashboard/products");
  return {};
}
