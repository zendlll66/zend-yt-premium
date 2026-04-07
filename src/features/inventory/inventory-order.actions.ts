"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createInventoryOrder,
  updateInventoryOrderById,
  deleteInventoryOrderById,
} from "./inventory-order.repo";
import type { InventoryItemType } from "@/db/schema/customer-inventory.schema";
import { updateCustomerInventoriesDatesByOrderIdAndType } from "./customer-inventory.repo";
import { getSessionUser } from "@/lib/auth-server";
import { createAuditLog } from "@/features/audit/audit.repo";

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
  const durationMonths = Math.max(
    1,
    parseInt((formData.get("durationMonths") as string) ?? "1", 10) || 1
  );
  const activatedAt = parseDate((formData.get("activatedAt") as string) ?? null);
  const expiresAt = parseDate((formData.get("expiresAt") as string) ?? null);
  const loginEmail = (formData.get("loginEmail") as string)?.trim() || null;
  const loginPassword = (formData.get("loginPassword") as string)?.trim() || null;
  const inviteLink = (formData.get("inviteLink") as string)?.trim() || null;
  const note = (formData.get("note") as string)?.trim() || null;
  const redirectTo = parseRedirectTo((formData.get("redirectTo") as string) ?? null, "");

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
    durationMonths,
    activatedAt: activatedAt ?? undefined,
    expiresAt: expiresAt ?? undefined,
    note,
  });

  if (!result) {
    return { error: "สร้างไม่สำเร็จ (ไม่พบลูกค้า หรือข้อผิดพลาดจากระบบ)" };
  }

  const user = await getSessionUser();
  await createAuditLog({ adminUserId: user?.id, action: "inventory.create", entityType: "customer_inventory", entityId: String(result.inventoryId), details: `สร้าง inventory: ${title} (customer #${customerId})` });
  revalidatePath("/dashboard/inventory/orders/active");
  revalidatePath("/dashboard/inventory/orders/expiring");
  revalidatePath("/dashboard/inventory/orders/expired");
  revalidatePath("/dashboard");
  if (redirectTo) {
    revalidatePath(redirectTo);
    redirect(redirectTo);
  }
  redirect(`/dashboard/inventory/orders/${result.inventoryId}/edit`);
}

export async function updateInventoryOrderAction(
  formData: FormData
): Promise<void> {
  const id = parseId((formData.get("id") as string) ?? null);
  const itemType = parseItemType((formData.get("itemType") as string) ?? null);
  const title = (formData.get("title") as string)?.trim() ?? "";
  const durationMonths = Math.max(
    1,
    parseInt((formData.get("durationMonths") as string) ?? "1", 10) || 1
  );
  const activatedAt = parseDate((formData.get("activatedAt") as string) ?? null);
  const expiresAt = parseDate((formData.get("expiresAt") as string) ?? null);
  const loginEmail = (formData.get("loginEmail") as string)?.trim() || null;
  const loginPasswordTrim = ((formData.get("loginPassword") as string) ?? "").trim();
  const inviteLink = (formData.get("inviteLink") as string)?.trim() || null;
  const note = (formData.get("note") as string)?.trim() || null;

  if (!id) {
    redirect("/dashboard/inventory/orders/active");
    return;
  }
  if (!itemType || !title) {
    redirect(`/dashboard/inventory/orders/${id}/edit`);
    return;
  }

  const updated = await updateInventoryOrderById(id, {
    itemType,
    title,
    loginEmail,
    ...(loginPasswordTrim !== "" ? { loginPassword: loginPasswordTrim } : {}),
    inviteLink,
    durationMonths,
    activatedAt,
    expiresAt,
    note,
  });

  // ถ้าแก้ไขไม่สำเร็จ ให้ redirect กลับหน้าเดิมเพื่อให้ผู้ใช้ลองใหม่
  if (!updated) {
    redirect(`/dashboard/inventory/orders/${id}/edit`);
    return;
  }

  const user = await getSessionUser();
  await createAuditLog({ adminUserId: user?.id, action: "inventory.update", entityType: "customer_inventory", entityId: String(id), details: `แก้ไข inventory #${id}: ${title}` });
  revalidatePath("/dashboard/inventory/orders/active");
  revalidatePath("/dashboard/inventory/orders/expiring");
  revalidatePath("/dashboard/inventory/orders/expired");
  revalidatePath(`/dashboard/inventory/orders/${id}/edit`);
  redirect(`/dashboard/inventory/orders/${id}/edit`);
}

function parseRedirectTo(value: string | null, fallback = "/dashboard/stocks"): string {
  const v = (value ?? "").trim();
  if (v.startsWith("/dashboard/stocks/account-stock/") && v.endsWith("/edit")) return v;
  if (v.startsWith("/dashboard/stocks/family-members/") && v.endsWith("/edit")) return v;
  if (v.startsWith("/dashboard/customers/") && v.includes("/inventory")) return v;
  return fallback;
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

export async function updateInventoryDatesByOrderAction(formData: FormData) {
  const orderId = parseId((formData.get("orderId") as string) ?? null);
  const itemType = parseItemType((formData.get("itemType") as string) ?? null);
  const activatedAt = parseDate((formData.get("activatedAt") as string) ?? null);
  const expiresAt = parseDate((formData.get("expiresAt") as string) ?? null);
  const note = (formData.get("note") as string)?.trim() || null;
  const redirectTo = ((formData.get("redirectTo") as string) ?? "").trim() || "/dashboard/stocks";

  if (!orderId || !itemType) return;

  const updatedCount = await updateCustomerInventoriesDatesByOrderIdAndType({
    orderId,
    itemType,
    activatedAt,
    expiresAt,
    note,
  });

  if (updatedCount > 0) {
    revalidatePath("/dashboard/stocks");
  }
  redirect(redirectTo);
}

export async function deleteInventoryOrderAction(formData: FormData): Promise<void> {
  const id = parseId((formData.get("id") as string) ?? null);
  const redirectTo = parseRedirectTo((formData.get("redirectTo") as string) ?? null, "");
  if (!id) {
    redirect("/dashboard/inventory/orders/active");
    return;
  }
  const deleted = await deleteInventoryOrderById(id);
  if (deleted) {
    const user = await getSessionUser();
    await createAuditLog({ adminUserId: user?.id, action: "inventory.delete", entityType: "customer_inventory", entityId: String(id), details: `ลบ inventory #${id}` });
    revalidatePath("/dashboard/inventory/orders/active");
    revalidatePath("/dashboard/inventory/orders/expiring");
    revalidatePath("/dashboard/inventory/orders/expired");
    revalidatePath("/dashboard");
    if (redirectTo) revalidatePath(redirectTo);
  }
  redirect(redirectTo || "/dashboard/inventory/orders/active");
}
