"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addFamilyMember,
  createAccountStock,
  createCustomerAccount,
  createFamilyGroup,
  deleteAccountStockById,
  deleteCustomerAccountById,
  deleteFamilyGroupById,
  removeFamilyMemberById,
  updateAccountStockStatus,
  updateAccountStockById,
  updateCustomerAccountStatus,
  updateCustomerAccountById,
  findCustomerAccountsByOrderId,
  updateCustomerAccountsStatusByOrderId,
  findCustomerAccountNotifyTarget,
  updateFamilyGroupById,
  updateFamilyMemberById,
  updateFamilyGroupHeadAccount,
  findAccountStockById,
} from "./youtube-stock.repo";
import { createInventoryOrder, updateInventoryOrderCustomer } from "@/features/inventory/inventory-order.repo";
import { pushLineTextMessage } from "@/lib/line-message";
import { getSessionUser } from "@/lib/auth-server";
import { createAuditLog } from "@/features/audit/audit.repo";
import { getLineTemplate, renderTemplate } from "@/features/support/line-template.repo";

function refreshStocksPage() {
  revalidatePath("/dashboard/stocks");
}

export async function createAccountStockAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim() ?? "";
  const password = (formData.get("password") as string)?.trim() ?? "";
  const customerId = parseOptionalInt((formData.get("customerId") as string) ?? null);
  const activatedAt = parseOptionalDate((formData.get("activatedAt") as string) ?? null);
  const expiresAt = parseOptionalDate((formData.get("expiresAt") as string) ?? null);
  const title = (formData.get("title") as string)?.trim() || null;
  const note = (formData.get("note") as string)?.trim() || null;
  const durationMonths = Math.max(1, parseInt((formData.get("durationMonths") as string) ?? "1", 10) || 1);

  // ถ้ามีลูกค้า → auto sold, ไม่ก็ใช้ค่าที่กรอก
  const status: "available" | "reserved" | "sold" = customerId
    ? "sold"
    : (((formData.get("status") as string) || "available") as "available" | "reserved" | "sold");

  if (!email || !password) return;

  const stock = await createAccountStock({ email, password, status });

  // ถ้ามีลูกค้า → สร้าง inventory order และ link กับ stock
  if (stock && customerId) {
    const result = await createInventoryOrder({
      customerId,
      itemType: "individual",
      title: title || email,
      loginEmail: email,
      loginPassword: password,
      durationMonths,
      activatedAt: activatedAt ?? undefined,
      expiresAt: expiresAt ?? undefined,
      note: note ?? null,
    });

    if (result) {
      await updateAccountStockById({
        id: stock.id,
        email,
        password,
        status: "sold",
        orderId: result.orderId,
        customerId,
        soldAt: new Date(),
      });
    }
  }

  const user = await getSessionUser();
  await createAuditLog({
    adminUserId: user?.id,
    action: "stock.account.create",
    entityType: "account_stock",
    entityId: stock ? String(stock.id) : undefined,
    details: `เพิ่ม account stock: ${email}${customerId ? ` (assign customer #${customerId})` : ""}`,
  });
  revalidatePath("/dashboard/stocks/account-stock");
  refreshStocksPage();
  redirect("/dashboard/stocks/account-stock");
}

/** สร้าง Inventory สำหรับ stock ที่มีลูกค้าแล้วแต่ยังไม่มี inventory */
export async function createStockInventoryAction(formData: FormData) {
  const stockId = parseOptionalInt((formData.get("stockId") as string) ?? null);
  const customerId = parseOptionalInt((formData.get("customerId") as string) ?? null);
  const activatedAt = parseOptionalDate((formData.get("activatedAt") as string) ?? null);
  const expiresAt = parseOptionalDate((formData.get("expiresAt") as string) ?? null);
  const title = (formData.get("title") as string)?.trim() || null;
  const note = (formData.get("note") as string)?.trim() || null;
  const durationMonths = Math.max(1, parseInt((formData.get("durationMonths") as string) ?? "1", 10) || 1);

  if (!stockId || !customerId) return;

  const stock = await findAccountStockById(stockId);
  if (!stock) return;

  const result = await createInventoryOrder({
    customerId,
    itemType: "individual",
    title: title || stock.email,
    loginEmail: stock.email,
    loginPassword: stock.password,
    durationMonths,
    activatedAt: activatedAt ?? undefined,
    expiresAt: expiresAt ?? undefined,
    note: note ?? null,
  });

  if (result) {
    await updateAccountStockById({
      id: stockId,
      email: stock.email,
      password: stock.password,
      status: "sold",
      orderId: result.orderId,
      customerId,
      soldAt: stock.soldAt ?? new Date(),
    });
    const user = await getSessionUser();
    await createAuditLog({
      adminUserId: user?.id,
      action: "stock.account.assign",
      entityType: "account_stock",
      entityId: String(stockId),
      details: `สร้าง inventory สำหรับ account stock #${stockId} (customer #${customerId})`,
    });
  }

  revalidatePath(`/dashboard/stocks/account-stock/${stockId}/edit`);
  revalidatePath("/dashboard/stocks/account-stock");
  refreshStocksPage();
  redirect(`/dashboard/stocks/account-stock/${stockId}/edit`);
}

export async function updateAccountStockStatusAction(formData: FormData) {
  const id = parseInt((formData.get("id") as string) ?? "0", 10);
  const status = ((formData.get("status") as string) || "available") as "available" | "reserved" | "sold";
  if (!id || !Number.isFinite(id)) return;
  await updateAccountStockStatus(id, status);
  refreshStocksPage();
}

function parseOptionalInt(value: string | null): number | null {
  if (value == null || value === "") return null;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

function parseOptionalDate(value: string | null): Date | null {
  if (value == null || value === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function updateAccountStockAction(formData: FormData) {
  const id = parseInt((formData.get("id") as string) ?? "0", 10);
  const email = (formData.get("email") as string)?.trim() ?? "";
  const password = (formData.get("password") as string)?.trim() ?? "";
  const status = ((formData.get("status") as string) || "available") as "available" | "reserved" | "sold";
  const orderId = parseOptionalInt((formData.get("orderId") as string) ?? null);
  const customerId = parseOptionalInt((formData.get("customerId") as string) ?? null);
  const reservedAt = formData.has("reservedAt")
    ? parseOptionalDate((formData.get("reservedAt") as string) ?? null)
    : undefined;
  const soldAt = parseOptionalDate((formData.get("soldAt") as string) ?? null);
  const createdAt = parseOptionalDate((formData.get("createdAt") as string) ?? null);
  const updatedAt = parseOptionalDate((formData.get("updatedAt") as string) ?? null);
  if (!id || !Number.isFinite(id) || !email || !password) return;

  // อ่านค่าเก่าก่อนอัปเดต เพื่อตรวจว่า customerId เปลี่ยนหรือไม่
  const prevStock = await findAccountStockById(id);
  const prevCustomerId = prevStock?.customerId ?? null;
  const prevOrderId = prevStock?.orderId ?? null;

  await updateAccountStockById({
    id,
    email,
    password,
    status,
    orderId,
    customerId,
    reservedAt,
    soldAt,
    createdAt,
    updatedAt,
  });

  // ถ้าเปลี่ยนลูกค้า → อัปเดต customerId ใน inventory + order ด้วย
  const effectiveOrderId = orderId ?? prevOrderId;
  if (effectiveOrderId && customerId && customerId !== prevCustomerId) {
    await updateInventoryOrderCustomer(effectiveOrderId, customerId);
  }

  const user = await getSessionUser();
  await createAuditLog({
    adminUserId: user?.id,
    action: "stock.account.update",
    entityType: "account_stock",
    entityId: String(id),
    details: `แก้ไข account stock #${id}: ${email}${customerId !== prevCustomerId ? ` (เปลี่ยนลูกค้า → #${customerId})` : ""}`,
  });
  revalidatePath("/dashboard/stocks/account-stock");
  revalidatePath(`/dashboard/stocks/account-stock/${id}/edit`);
  refreshStocksPage();
  redirect(`/dashboard/stocks/account-stock/${id}/edit`);
}

export async function deleteAccountStockAction(formData: FormData) {
  const id = parseInt((formData.get("id") as string) ?? "0", 10);
  if (!id || !Number.isFinite(id)) return;
  await deleteAccountStockById(id);
  const user = await getSessionUser();
  await createAuditLog({ adminUserId: user?.id, action: "stock.account.delete", entityType: "account_stock", entityId: String(id), details: `ลบ account stock #${id}` });
  refreshStocksPage();
}

export async function createFamilyGroupAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim() ?? "";
  const limit = parseInt((formData.get("limit") as string) ?? "0", 10);
  const notes = (formData.get("notes") as string)?.trim() ?? "";
  const headEmail = (formData.get("head_email") as string)?.trim() ?? "";
  const headPassword = (formData.get("head_password") as string)?.trim() ?? "";
  if (!name || !Number.isFinite(limit) || limit < 1) return;
  const group = await createFamilyGroup({
    name,
    limit,
    notes: notes || null,
    headEmail: headEmail || null,
    headPassword: headPassword || null,
  });
  const user = await getSessionUser();
  await createAuditLog({ adminUserId: user?.id, action: "stock.family.create", entityType: "family_group", entityId: group ? String(group.id) : undefined, details: `สร้าง family group: ${name}` });
  refreshStocksPage();
}

export async function updateFamilyGroupHeadAccountAction(formData: FormData) {
  const id = parseInt((formData.get("id") as string) ?? "0", 10);
  const headEmail = (formData.get("head_email") as string)?.trim() ?? "";
  const headPassword = (formData.get("head_password") as string)?.trim() ?? "";
  if (!id || !Number.isFinite(id)) return;
  await updateFamilyGroupHeadAccount({
    id,
    headEmail: headEmail || null,
    headPassword: headPassword || null,
  });
  refreshStocksPage();
}

export async function updateFamilyGroupAction(formData: FormData) {
  const id = parseInt((formData.get("id") as string) ?? "0", 10);
  const name = (formData.get("name") as string)?.trim() ?? "";
  const limit = parseInt((formData.get("limit") as string) ?? "0", 10);
  const notes = (formData.get("notes") as string)?.trim() ?? "";
  const headEmail = (formData.get("head_email") as string)?.trim() ?? "";
  const headPassword = (formData.get("head_password") as string)?.trim() ?? "";
  if (!id || !Number.isFinite(id) || !name || !Number.isFinite(limit) || limit < 1) return;
  await updateFamilyGroupById({
    id,
    name,
    limit,
    notes: notes || null,
    headEmail: headEmail || null,
    headPassword: headPassword || null,
  });
  const user = await getSessionUser();
  await createAuditLog({ adminUserId: user?.id, action: "stock.family.update", entityType: "family_group", entityId: String(id), details: `แก้ไข family group #${id}: ${name}` });
  refreshStocksPage();
}

export async function deleteFamilyGroupAction(formData: FormData) {
  const id = parseInt((formData.get("id") as string) ?? "0", 10);
  if (!id || !Number.isFinite(id)) return;
  await deleteFamilyGroupById(id);
  const user = await getSessionUser();
  await createAuditLog({ adminUserId: user?.id, action: "stock.family.delete", entityType: "family_group", entityId: String(id), details: `ลบ family group #${id}` });
  refreshStocksPage();
}

export async function addFamilyMemberAction(formData: FormData) {
  const familyGroupId = parseInt((formData.get("family_group_id") as string) ?? "0", 10);
  if (!familyGroupId || !Number.isFinite(familyGroupId)) return;

  const mode = ((formData.get("add_member_mode") as string) || "credentials").trim();
  if (mode === "invite") {
    const inviteLink = (formData.get("invite_link") as string)?.trim() ?? "";
    const slotLabel = (formData.get("slot_label") as string)?.trim() ?? "";
    if (!inviteLink) return;
    const email = slotLabel || "(ลิงก์เชิญ)";
    await addFamilyMember({
      familyGroupId,
      email,
      memberPassword: null,
      inviteLink,
    });
  } else {
    const email = (formData.get("email") as string)?.trim() ?? "";
    const memberPassword = (formData.get("member_password") as string)?.trim() ?? "";
    if (!email || !memberPassword) return;
    await addFamilyMember({ familyGroupId, email, memberPassword, inviteLink: null });
  }
  refreshStocksPage();
}

export async function removeFamilyMemberAction(formData: FormData) {
  const id = parseInt((formData.get("id") as string) ?? "0", 10);
  if (!id || !Number.isFinite(id)) return;
  await removeFamilyMemberById(id);
  refreshStocksPage();
}

export async function updateFamilyMemberAction(formData: FormData) {
  const id = parseInt((formData.get("id") as string) ?? "0", 10);
  const email = (formData.get("email") as string)?.trim() ?? "";
  const memberPassword = (formData.get("member_password") as string)?.trim() ?? "";
  const inviteLink = (formData.get("invite_link") as string)?.trim() ?? "";
  const orderId = parseOptionalInt((formData.get("orderId") as string) ?? null);
  const customerId = parseOptionalInt((formData.get("customerId") as string) ?? null);
  if (!id || !Number.isFinite(id) || !email) return;
  await updateFamilyMemberById({
    id,
    email,
    memberPassword: memberPassword || null,
    inviteLink: inviteLink || null,
    orderId,
    customerId,
  });
  refreshStocksPage();
}

export async function updateCustomerAccountStatusAction(formData: FormData) {
  const id = parseInt((formData.get("id") as string) ?? "0", 10);
  const status = ((formData.get("status") as string) || "pending") as "pending" | "processing" | "done";
  const notes = (formData.get("notes") as string)?.trim() ?? "";
  if (!id || !Number.isFinite(id)) return;
  const before = await findCustomerAccountNotifyTarget(id);
  await updateCustomerAccountStatus(id, status, notes || null);
  const user = await getSessionUser();
  await createAuditLog({ adminUserId: user?.id, action: "stock.customer_account.status", entityType: "customer_account", entityId: String(id), details: `อัปเดตสถานะ customer account #${id} → ${status}` });
  const after = await findCustomerAccountNotifyTarget(id);
  if (before && after && before.status !== "done" && after.status === "done" && after.lineUserId) {
    const tpl = await getLineTemplate("customer_account_done").catch(() => null);
    if (tpl?.isEnabled !== false) {
      const msg = renderTemplate(
        tpl?.template ?? "✅ บัญชีของคุณใช้งานได้แล้ว\nบัญชี: {{accountEmail}}\n{{adminNote}}",
        { accountEmail: after.email ?? "", adminNote: after.notes?.trim() ?? "" }
      );
      await pushLineTextMessage(after.lineUserId, msg);
    }
  }
  refreshStocksPage();
}

export async function updateCustomerAccountsStatusByOrderIdAction(formData: FormData) {
  const orderId = parseInt((formData.get("orderId") as string) ?? "0", 10);
  const status = ((formData.get("status") as string) || "pending") as "pending" | "processing" | "done";
  const notes = (formData.get("notes") as string)?.trim() ?? "";
  if (!orderId || !Number.isFinite(orderId)) return;

  // สำหรับ trigger LINE เมื่อเปลี่ยนสถานะไป done (subscribed)
  const beforeAccounts = await findCustomerAccountsByOrderId(orderId);
  const beforeById = new Map(beforeAccounts.map((a) => [a.id, a] as const));

  const updated = await updateCustomerAccountsStatusByOrderId(orderId, status, notes || null);
  // อัปเดตได้แม้จำนวนจะเป็น 0 แต่โดยปกติควรมีรายการใน order นี้
  refreshStocksPage();
  revalidatePath(`/dashboard/orders/${orderId}`);

  // ส่ง LINE เมื่อ admin อัปเดต workflow สำหรับ customer_account
  // - processing: "กำลังดำเนินการ"
  // - done: "สมัครใช้งานแล้ว/ใช้งานได้แล้ว"
  const shouldNotify = status === "processing" || status === "done";
  if (shouldNotify) {
    for (const after of updated) {
      const before = beforeById.get(after.id);
      if (!before) continue;
      if (before.status === status) continue;

      const target = await findCustomerAccountNotifyTarget(after.id);
      if (!target?.lineUserId) continue;

      const templateKey = status === "processing" ? "customer_account_processing" : "customer_account_done";
      const tpl = await getLineTemplate(templateKey).catch(() => null);
      if (tpl?.isEnabled === false) continue;
      const message = renderTemplate(
        tpl?.template ??
          (status === "processing"
            ? "⏳ บัญชีของคุณกำลังดำเนินการ\nบัญชี: {{accountEmail}}\n{{adminNote}}"
            : "✅ บัญชีของคุณใช้งานได้แล้ว\nบัญชี: {{accountEmail}}\n{{adminNote}}"),
        { accountEmail: after.email ?? "", adminNote: target.notes?.trim() ?? "" }
      );
      await pushLineTextMessage(target.lineUserId, message);
    }
  }

}

export async function createCustomerAccountAction(formData: FormData) {
  const customerId = parseOptionalInt((formData.get("customerId") as string) ?? null);
  const orderId = parseOptionalInt((formData.get("orderId") as string) ?? null);
  const email = (formData.get("email") as string)?.trim() ?? "";
  const password = (formData.get("password") as string)?.trim() ?? "";
  const status = ((formData.get("status") as string) || "pending") as "pending" | "processing" | "done";
  const notes = (formData.get("notes") as string)?.trim() ?? "";
  if (!customerId || !orderId || !Number.isFinite(customerId) || !Number.isFinite(orderId) || !email || !password)
    return;
  await createCustomerAccount({
    customerId,
    orderId,
    email,
    password,
    status,
    notes: notes || null,
  });
  revalidatePath("/dashboard/stocks/customer-accounts");
  refreshStocksPage();
  redirect("/dashboard/stocks/customer-accounts");
}

export async function updateCustomerAccountAction(formData: FormData) {
  const id = parseInt((formData.get("id") as string) ?? "0", 10);
  const email = (formData.get("email") as string)?.trim() ?? "";
  const password = (formData.get("password") as string)?.trim() ?? "";
  const status = ((formData.get("status") as string) || "pending") as "pending" | "processing" | "done";
  const notes = (formData.get("notes") as string)?.trim() ?? "";
  const orderId = parseOptionalInt((formData.get("orderId") as string) ?? null);
  const customerId = parseOptionalInt((formData.get("customerId") as string) ?? null);
  if (!id || !Number.isFinite(id) || !email || !password) return;
  const before = await findCustomerAccountNotifyTarget(id);
  await updateCustomerAccountById({
    id,
    email,
    password,
    status,
    notes: notes || null,
    ...(orderId != null && { orderId }),
    ...(customerId != null && { customerId }),
  });
  const after = await findCustomerAccountNotifyTarget(id);
  if (before && after && before.status !== "done" && after.status === "done" && after.lineUserId) {
    const tpl = await getLineTemplate("customer_account_done").catch(() => null);
    if (tpl?.isEnabled !== false) {
      const msg = renderTemplate(
        tpl?.template ?? "✅ บัญชีของคุณใช้งานได้แล้ว\nบัญชี: {{accountEmail}}\n{{adminNote}}",
        { accountEmail: after.email ?? "", adminNote: after.notes?.trim() ?? "" }
      );
      await pushLineTextMessage(after.lineUserId, msg);
    }
  }
  revalidatePath("/dashboard/stocks/customer-accounts");
  refreshStocksPage();
  redirect("/dashboard/stocks/customer-accounts");
}

export async function deleteCustomerAccountAction(formData: FormData) {
  const id = parseInt((formData.get("id") as string) ?? "0", 10);
  if (!id || !Number.isFinite(id)) return;
  await deleteCustomerAccountById(id);
  revalidatePath("/dashboard/stocks/customer-accounts");
  refreshStocksPage();
}

