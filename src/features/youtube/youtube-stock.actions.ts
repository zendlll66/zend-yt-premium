"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addFamilyMember,
  createAccountStock,
  createFamilyGroup,
  createInviteLink,
  deleteAccountStockById,
  deleteCustomerAccountById,
  deleteFamilyGroupById,
  deleteInviteLinkById,
  removeFamilyMemberById,
  updateAccountStockStatus,
  updateAccountStockById,
  updateCustomerAccountStatus,
  updateCustomerAccountById,
  findCustomerAccountNotifyTarget,
  updateFamilyGroupById,
  updateFamilyMemberById,
  updateFamilyGroupHeadAccount,
  updateInviteLinkById,
  updateInviteLinkStatus,
} from "./youtube-stock.repo";
import { pushLineTextMessage } from "@/lib/line-message";

function refreshStocksPage() {
  revalidatePath("/dashboard/stocks");
}

export async function createAccountStockAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim() ?? "";
  const password = (formData.get("password") as string)?.trim() ?? "";
  const status = ((formData.get("status") as string) || "available") as "available" | "reserved" | "sold";
  if (!email || !password) return;
  await createAccountStock({ email, password, status });
  revalidatePath("/dashboard/stocks/account-stock");
  refreshStocksPage();
  redirect("/dashboard/stocks/account-stock");
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
  const reservedAt = parseOptionalDate((formData.get("reservedAt") as string) ?? null);
  const soldAt = parseOptionalDate((formData.get("soldAt") as string) ?? null);
  const createdAt = parseOptionalDate((formData.get("createdAt") as string) ?? null);
  const updatedAt = parseOptionalDate((formData.get("updatedAt") as string) ?? null);
  if (!id || !Number.isFinite(id) || !email || !password) return;
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
  revalidatePath("/dashboard/stocks/account-stock");
  refreshStocksPage();
  redirect("/dashboard/stocks/account-stock");
}

export async function deleteAccountStockAction(formData: FormData) {
  const id = parseInt((formData.get("id") as string) ?? "0", 10);
  if (!id || !Number.isFinite(id)) return;
  await deleteAccountStockById(id);
  refreshStocksPage();
}

export async function createFamilyGroupAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim() ?? "";
  const limit = parseInt((formData.get("limit") as string) ?? "0", 10);
  const notes = (formData.get("notes") as string)?.trim() ?? "";
  const headEmail = (formData.get("head_email") as string)?.trim() ?? "";
  const headPassword = (formData.get("head_password") as string)?.trim() ?? "";
  if (!name || !Number.isFinite(limit) || limit < 1) return;
  await createFamilyGroup({
    name,
    limit,
    notes: notes || null,
    headEmail: headEmail || null,
    headPassword: headPassword || null,
  });
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
  refreshStocksPage();
}

export async function deleteFamilyGroupAction(formData: FormData) {
  const id = parseInt((formData.get("id") as string) ?? "0", 10);
  if (!id || !Number.isFinite(id)) return;
  await deleteFamilyGroupById(id);
  refreshStocksPage();
}

export async function addFamilyMemberAction(formData: FormData) {
  const familyGroupId = parseInt((formData.get("family_group_id") as string) ?? "0", 10);
  const email = (formData.get("email") as string)?.trim() ?? "";
  const memberPassword = (formData.get("member_password") as string)?.trim() ?? "";
  if (!familyGroupId || !Number.isFinite(familyGroupId) || !email || !memberPassword) return;
  await addFamilyMember({ familyGroupId, email, memberPassword });
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
  if (!id || !Number.isFinite(id) || !email || !memberPassword) return;
  await updateFamilyMemberById({ id, email, memberPassword });
  refreshStocksPage();
}

export async function createInviteLinkAction(formData: FormData) {
  const link = (formData.get("link") as string)?.trim() ?? "";
  const status = ((formData.get("status") as string) || "available") as "available" | "reserved" | "used";
  if (!link) return;
  await createInviteLink({ link, status });
  refreshStocksPage();
}

export async function updateInviteLinkStatusAction(formData: FormData) {
  const id = parseInt((formData.get("id") as string) ?? "0", 10);
  const status = ((formData.get("status") as string) || "available") as "available" | "reserved" | "used";
  if (!id || !Number.isFinite(id)) return;
  await updateInviteLinkStatus(id, status);
  refreshStocksPage();
}

export async function updateInviteLinkAction(formData: FormData) {
  const id = parseInt((formData.get("id") as string) ?? "0", 10);
  const link = (formData.get("link") as string)?.trim() ?? "";
  const status = ((formData.get("status") as string) || "available") as "available" | "reserved" | "used";
  if (!id || !Number.isFinite(id) || !link) return;
  await updateInviteLinkById({ id, link, status });
  refreshStocksPage();
}

export async function deleteInviteLinkAction(formData: FormData) {
  const id = parseInt((formData.get("id") as string) ?? "0", 10);
  if (!id || !Number.isFinite(id)) return;
  await deleteInviteLinkById(id);
  refreshStocksPage();
}

export async function updateCustomerAccountStatusAction(formData: FormData) {
  const id = parseInt((formData.get("id") as string) ?? "0", 10);
  const status = ((formData.get("status") as string) || "pending") as "pending" | "processing" | "done";
  const notes = (formData.get("notes") as string)?.trim() ?? "";
  if (!id || !Number.isFinite(id)) return;
  const before = await findCustomerAccountNotifyTarget(id);
  await updateCustomerAccountStatus(id, status, notes || null);
  const after = await findCustomerAccountNotifyTarget(id);
  if (
    before &&
    after &&
    before.status !== "done" &&
    after.status === "done" &&
    after.lineUserId
  ) {
    const noteLine = after.notes?.trim() ? `\nหมายเหตุ: ${after.notes.trim()}` : "";
    await pushLineTextMessage(
      after.lineUserId,
      `บัญชีนี้ใช้งานได้แล้ว\nบัญชี: ${after.email}${noteLine}`
    );
  }
  refreshStocksPage();
}

export async function updateCustomerAccountAction(formData: FormData) {
  const id = parseInt((formData.get("id") as string) ?? "0", 10);
  const email = (formData.get("email") as string)?.trim() ?? "";
  const password = (formData.get("password") as string)?.trim() ?? "";
  const status = ((formData.get("status") as string) || "pending") as "pending" | "processing" | "done";
  const notes = (formData.get("notes") as string)?.trim() ?? "";
  if (!id || !Number.isFinite(id) || !email || !password) return;
  const before = await findCustomerAccountNotifyTarget(id);
  await updateCustomerAccountById({ id, email, password, status, notes: notes || null });
  const after = await findCustomerAccountNotifyTarget(id);
  if (
    before &&
    after &&
    before.status !== "done" &&
    after.status === "done" &&
    after.lineUserId
  ) {
    const noteLine = after.notes?.trim() ? `\nหมายเหตุ: ${after.notes.trim()}` : "";
    await pushLineTextMessage(
      after.lineUserId,
      `บัญชีนี้ใช้งานได้แล้ว\nบัญชี: ${after.email}${noteLine}`
    );
  }
  refreshStocksPage();
}

export async function deleteCustomerAccountAction(formData: FormData) {
  const id = parseInt((formData.get("id") as string) ?? "0", 10);
  if (!id || !Number.isFinite(id)) return;
  await deleteCustomerAccountById(id);
  refreshStocksPage();
}

