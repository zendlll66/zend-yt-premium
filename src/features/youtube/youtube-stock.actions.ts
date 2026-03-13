"use server";

import { revalidatePath } from "next/cache";
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
  updateCustomerAccountStatus,
  updateInviteLinkStatus,
} from "./youtube-stock.repo";

function refreshStocksPage() {
  revalidatePath("/dashboard/stocks");
}

export async function createAccountStockAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim() ?? "";
  const password = (formData.get("password") as string)?.trim() ?? "";
  const status = ((formData.get("status") as string) || "available") as "available" | "reserved" | "sold";
  if (!email || !password) return;
  await createAccountStock({ email, password, status });
  refreshStocksPage();
}

export async function updateAccountStockStatusAction(formData: FormData) {
  const id = parseInt((formData.get("id") as string) ?? "0", 10);
  const status = ((formData.get("status") as string) || "available") as "available" | "reserved" | "sold";
  if (!id || !Number.isFinite(id)) return;
  await updateAccountStockStatus(id, status);
  refreshStocksPage();
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
  if (!name || !Number.isFinite(limit) || limit < 1) return;
  await createFamilyGroup({ name, limit, notes: notes || null });
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
  if (!familyGroupId || !Number.isFinite(familyGroupId) || !email) return;
  await addFamilyMember({ familyGroupId, email });
  refreshStocksPage();
}

export async function removeFamilyMemberAction(formData: FormData) {
  const id = parseInt((formData.get("id") as string) ?? "0", 10);
  if (!id || !Number.isFinite(id)) return;
  await removeFamilyMemberById(id);
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
  await updateCustomerAccountStatus(id, status, notes || null);
  refreshStocksPage();
}

export async function deleteCustomerAccountAction(formData: FormData) {
  const id = parseInt((formData.get("id") as string) ?? "0", 10);
  if (!id || !Number.isFinite(id)) return;
  await deleteCustomerAccountById(id);
  refreshStocksPage();
}

