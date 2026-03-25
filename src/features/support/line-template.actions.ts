"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth-server";
import { updateLineTemplate } from "./line-template.repo";

/** Admin บันทึกเทมเพลต LINE */
export async function saveLineTemplateAction(
  _prev: Record<string, unknown>,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const admin = await getSessionUser();
  if (!admin) return { error: "Unauthorized" };

  const id = parseInt(formData.get("id")?.toString() ?? "", 10);
  const template = formData.get("template")?.toString() ?? "";
  const isEnabled = formData.get("isEnabled") === "1";

  if (!id) return { error: "ไม่พบเทมเพลต" };
  if (!template.trim()) return { error: "กรุณากรอกเนื้อหาเทมเพลต" };

  await updateLineTemplate(id, { template, isEnabled });

  revalidatePath("/dashboard/settings/line-templates");
  return { success: true };
}
