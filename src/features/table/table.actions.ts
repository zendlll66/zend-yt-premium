"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { TABLE_STATUSES, type TableStatus } from "@/db/schema/table.schema";
import { findTableById, createTable, updateTable, deleteTableById } from "./table.repo";

function parseTableStatus(s: string): TableStatus {
  return TABLE_STATUSES.includes(s as TableStatus) ? (s as TableStatus) : "available";
}

export type CreateTableState = { error?: string };
export type UpdateTableState = { error?: string };

export async function createTableAction(
  _prev: CreateTableState,
  formData: FormData
): Promise<CreateTableState> {
  const tableNumber = (formData.get("table_number") as string)?.trim() ?? "";
  const capacity = parseInt((formData.get("capacity") as string) ?? "4", 10) || 4;
  if (!tableNumber) return { error: "กรุณากรอกเลขโต๊ะ" };

  const table = await createTable({ tableNumber, capacity });
  if (!table) return { error: "สร้างโต๊ะไม่สำเร็จ" };

  revalidatePath("/dashboard/tables");
  redirect("/dashboard/tables");
}

export async function updateTableAction(
  _prev: UpdateTableState,
  formData: FormData
): Promise<UpdateTableState> {
  const id = parseInt((formData.get("id") as string) ?? "0", 10);
  const tableNumber = (formData.get("table_number") as string)?.trim() ?? "";
  const status = parseTableStatus((formData.get("status") as string) ?? "available");
  const capacity = parseInt((formData.get("capacity") as string) ?? "4", 10) || 4;
  if (!id || !tableNumber) return { error: "กรุณากรอกเลขโต๊ะ" };

  const existing = await findTableById(id);
  if (!existing) return { error: "ไม่พบโต๊ะ" };

  const table = await updateTable(id, { tableNumber, status, capacity });
  if (!table) return { error: "อัปเดตไม่สำเร็จ" };

  revalidatePath("/dashboard/tables");
  redirect("/dashboard/tables");
}

export async function deleteTableAction(id: number): Promise<{ error?: string }> {
  const existing = await findTableById(id);
  if (!existing) return { error: "ไม่พบโต๊ะ" };

  const ok = await deleteTableById(id);
  revalidatePath("/dashboard/tables");
  if (!ok) return { error: "ลบไม่สำเร็จ" };
  return {};
}

export async function generateTableQrTokenAction(
  id: number
): Promise<{ token?: string; error?: string }> {
  const existing = await findTableById(id);
  if (!existing) return { error: "ไม่พบโต๊ะ" };

  const { randomBytes } = await import("crypto");
  const token = randomBytes(20).toString("base64url");

  const updated = await updateTable(id, { qrToken: token });
  revalidatePath("/dashboard/tables");
  if (!updated) return { error: "สร้าง QR ไม่สำเร็จ" };
  return { token };
}
