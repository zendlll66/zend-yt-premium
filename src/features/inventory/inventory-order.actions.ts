"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createInventoryOrder,
  updateInventoryOrderById,
  deleteInventoryOrderById,
} from "./inventory-order.repo";
import type { InventoryItemType } from "@/db/schema/customer-inventory.schema";

const INVENTORY_ITEM_TYPES: InventoryItemType[] = [
  "individual",
  "family",
  "invite",
  "customer_account",
];

function parseId(value: string | null): number | null {
  if (value == null || value === "") return null;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

function parseDate(value: string | null): Date | null {
  if (value == null || value === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseItemType(value: string | null): InventoryItemType | null {
  if (value == null || value === "") return null;
  return INVENTORY_ITEM_TYPES.includes(value as InventoryItemType)
    ? (value as InventoryItemType)
    : null;
}

export type CreateInventoryOrderState = { error?: string };

export async function createInventoryOrderAction(
  _prev: CreateInventoryOrderState,
  formData: FormData
): Promise<CreateInventoryOrderState> {
  const customerId = parseId((formData.get("customerId") as string) ?? null);
  const itemType = parseItemType((formData.get("itemType") as string) ?? null);
  const title = (formData.get("title") as string)?.trim() ?? "";
  const durationDays = Math.max(
    1,
    parseInt((formData.get("durationDays") as string) ?? "30", 10) || 30
  );
  const activatedAt = parseDate((formData.get("activatedAt") as string) ?? null);
  const expiresAt = parseDate((formData.get("expiresAt") as string) ?? null);
  const loginEmail = (formData.get("loginEmail") as string)?.trim() || null;
  const loginPassword = (formData.get("loginPassword") as string)?.trim() || null;
  const inviteLink = (formData.get("inviteLink") as string)?.trim() || null;
  const note = (formData.get("note") as string)?.trim() || null;

  if (!customerId || !itemType || !title) {
    return { error: "กรุณาเลือกลูกค้า ประเภท และกรอก Title" };
  }

  const result = await createInventoryOrder({
    customerId,
    itemType,
    title,
    loginEmail,
    loginPassword,
    inviteLink,
    durationDays,
    activatedAt: activatedAt ?? undefined,
    expiresAt: expiresAt ?? undefined,
    note,
  });

  if (!result) {
    return { error: "สร้างไม่สำเร็จ (ไม่พบลูกค้า หรือข้อผิดพลาดจากระบบ)" };
  }

  revalidatePath("/dashboard/inventory/orders/active");
  revalidatePath("/dashboard/inventory/orders/expiring");
  revalidatePath("/dashboard/inventory/orders/expired");
  revalidatePath("/dashboard");
  redirect(`/dashboard/inventory/orders/${result.inventoryId}/edit`);
}

export type UpdateInventoryOrderState = { error?: string };

export async function updateInventoryOrderAction(
  first: UpdateInventoryOrderState | FormData,
  second?: FormData
): Promise<UpdateInventoryOrderState> {
  const formData = second ?? (first instanceof FormData ? first : undefined);
  if (!formData) return { error: "Invalid request" };
  const id = parseId((formData.get("id") as string) ?? null);
  const itemType = parseItemType((formData.get("itemType") as string) ?? null);
  const title = (formData.get("title") as string)?.trim() ?? "";
  const durationDays = Math.max(
    1,
    parseInt((formData.get("durationDays") as string) ?? "30", 10) || 30
  );
  const activatedAt = parseDate((formData.get("activatedAt") as string) ?? null);
  const expiresAt = parseDate((formData.get("expiresAt") as string) ?? null);
  const loginEmail = (formData.get("loginEmail") as string)?.trim() || null;
  const loginPassword = (formData.get("loginPassword") as string)?.trim() || null;
  const inviteLink = (formData.get("inviteLink") as string)?.trim() || null;
  const note = (formData.get("note") as string)?.trim() || null;

  if (!id || !itemType || !title) {
    return { error: "กรุณากรอก ID, ประเภท และ Title" };
  }

  const updated = await updateInventoryOrderById(id, {
    itemType,
    title,
    loginEmail,
    loginPassword,
    inviteLink,
    durationDays,
    activatedAt,
    expiresAt,
    note,
  });

  if (!updated) {
    return { error: "แก้ไขไม่สำเร็จ" };
  }

  revalidatePath("/dashboard/inventory/orders/active");
  revalidatePath("/dashboard/inventory/orders/expiring");
  revalidatePath("/dashboard/inventory/orders/expired");
  revalidatePath(`/dashboard/inventory/orders/${id}/edit`);
  redirect(`/dashboard/inventory/orders/${id}/edit`);
}

function parseRedirectTo(value: string | null): string {
  const v = (value ?? "").trim();
  if (v.startsWith("/dashboard/stocks/account-stock/") && v.endsWith("/edit")) return v;
  if (v.startsWith("/dashboard/stocks/invite-links/") && v.endsWith("/edit")) return v;
  return "/dashboard/stocks";
}

export async function updateInventoryDatesAction(formData: FormData) {
  const id = parseId((formData.get("id") as string) ?? null);
  const activatedAt = parseDate((formData.get("activatedAt") as string) ?? null);
  const expiresAt = parseDate((formData.get("expiresAt") as string) ?? null);
  const note = (formData.get("note") as string)?.trim() || null;
  const redirectTo = parseRedirectTo((formData.get("redirectTo") as string) ?? null);

  if (!id) return;

  const updated = await updateInventoryOrderById(id, {
    activatedAt,
    expiresAt,
    note,
  });

  if (!updated) return;

  // ส่วนนี้อัปเดตเฉพาะ dates ของ customer_inventories
  revalidatePath("/dashboard/stocks");
  revalidatePath(redirectTo);
  redirect(redirectTo);
}

export async function deleteInventoryOrderAction(formData: FormData): Promise<void> {
  const id = parseId((formData.get("id") as string) ?? null);
  if (!id) {
    redirect("/dashboard/inventory/orders/active");
    return;
  }
  const deleted = await deleteInventoryOrderById(id);
  if (deleted) {
    revalidatePath("/dashboard/inventory/orders/active");
    revalidatePath("/dashboard/inventory/orders/expiring");
    revalidatePath("/dashboard/inventory/orders/expired");
    revalidatePath("/dashboard");
  }
  redirect("/dashboard/inventory/orders/active");
}
