"use server";

import { revalidatePath } from "next/cache";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { getSessionUser } from "@/lib/auth-server";
import { MIGRATION_STOCK_TYPES, type MigrationStatus } from "@/db/schema/migration-request.schema";
import {
  createMigrationRequest,
  updateMigrationRequestStatus,
} from "./migration-request.repo";

/** ลูกค้าส่งคำขอย้ายข้อมูล */
export async function submitMigrationRequestAction(
  _prev: Record<string, unknown>,
  formData: FormData
): Promise<{ error?: string; success?: boolean; requestId?: number }> {
  // ไม่บังคับ login
  const customer = await getCustomerSession().catch(() => null);

  const contactEmail = formData.get("contactEmail")?.toString().trim() ?? "";
  const stockType = formData.get("stockType")?.toString() ?? "";
  const loginEmail = formData.get("loginEmail")?.toString().trim() ?? "";
  const loginPassword = formData.get("loginPassword")?.toString().trim() ?? "";
  const note = formData.get("note")?.toString().trim() ?? "";

  if (!contactEmail) return { error: "กรุณากรอกอีเมลติดต่อกลับ" };
  if (!contactEmail.includes("@")) return { error: "รูปแบบอีเมลไม่ถูกต้อง" };
  if (!stockType || !MIGRATION_STOCK_TYPES.includes(stockType as any))
    return { error: "กรุณาเลือกประเภทสินค้า" };
  if (!loginEmail) return { error: "กรุณากรอกอีเมลที่ใช้ในระบบเดิม" };
  if (!loginEmail.includes("@")) return { error: "รูปแบบอีเมลใน service เดิมไม่ถูกต้อง" };

  // invite ไม่ต้องมี password
  if (stockType !== "invite" && !loginPassword)
    return { error: "กรุณากรอกรหัสผ่านที่ใช้ในระบบเดิม" };

  const req = await createMigrationRequest({
    customerId: customer?.id ?? null,
    contactEmail,
    stockType: stockType as any,
    loginEmail,
    loginPassword: stockType !== "invite" ? loginPassword : null,
    note: note || null,
  });

  revalidatePath("/migrate");
  return { success: true, requestId: req.id };
}

/** Admin อัปเดตสถานะคำขอ */
export async function updateMigrationStatusAction(
  _prev: Record<string, unknown>,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const admin = await getSessionUser();
  if (!admin) return { error: "Unauthorized" };

  const id = parseInt(formData.get("id")?.toString() ?? "", 10);
  const status = formData.get("status")?.toString() as MigrationStatus;
  const adminNote = formData.get("adminNote")?.toString().trim() ?? "";

  if (!id || !status) return { error: "ข้อมูลไม่ครบ" };

  const VALID: MigrationStatus[] = ["pending", "reviewing", "done", "rejected"];
  if (!VALID.includes(status)) return { error: "สถานะไม่ถูกต้อง" };

  await updateMigrationRequestStatus(id, status, adminNote || undefined);

  revalidatePath("/dashboard/migration-requests");
  revalidatePath(`/dashboard/migration-requests/${id}`);
  return { success: true };
}
