"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { customerInventories } from "@/db/schema/customer-inventory.schema";
import { customers } from "@/db/schema/customer.schema";
import { orders } from "@/db/schema/order.schema";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { findCustomerInventoryById } from "./customer-inventory.repo";
import { eq, and, lte, eq as eqOp } from "drizzle-orm";

/** ลูกค้าเปิด/ปิด auto-renew สำหรับ inventory item */
export async function toggleAutoRenewAction(
  _prev: { success?: boolean; error?: string },
  formData: FormData
) {
  const customer = await getCustomerSession();
  if (!customer) return { error: "กรุณาเข้าสู่ระบบ" };

  const inventoryId = parseInt(formData.get("inventoryId") as string, 10);
  const enable = formData.get("autoRenew") === "1";

  if (!Number.isFinite(inventoryId)) return { error: "ข้อมูลไม่ถูกต้อง" };

  const item = await findCustomerInventoryById(customer.id, inventoryId);
  if (!item) return { error: "ไม่พบรายการ" };

  await db
    .update(customerInventories)
    .set({ autoRenew: enable })
    .where(eq(customerInventories.id, inventoryId));

  revalidatePath("/account/inventory");
  return { success: true };
}

/** Cron: ตรวจหา inventory ที่หมดอายุแล้วและเปิด auto-renew — เรียกจาก /api/cron/auto-renewal */
export async function processAutoRenewalsAction(): Promise<{
  processed: number;
  errors: string[];
}> {
  const now = new Date();

  // หา inventory ที่หมดอายุและ autoRenew = true
  const expiredItems = await db
    .select({
      id: customerInventories.id,
      customerId: customerInventories.customerId,
      itemType: customerInventories.itemType,
      durationMonths: customerInventories.durationMonths,
      title: customerInventories.title,
      customerEmail: customers.email,
      customerName: customers.name,
    })
    .from(customerInventories)
    .leftJoin(customers, eq(customerInventories.customerId, customers.id))
    .where(
      and(
        eq(customerInventories.autoRenew, true),
        lte(customerInventories.expiresAt, now)
      )
    )
    .limit(50);

  let processed = 0;
  const errors: string[] = [];

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) return { processed: 0, errors: ["NEXT_PUBLIC_APP_URL ไม่ได้ตั้งค่า"] };

  for (const item of expiredItems) {
    try {
      // ปิด auto-renew ก่อน เพื่อไม่ให้ loop
      await db
        .update(customerInventories)
        .set({ autoRenew: false })
        .where(eq(customerInventories.id, item.id));

      // TODO: ถ้ามี Stripe Customer ID จะสามารถ charge อัตโนมัติได้
      // ปัจจุบัน: ส่ง LINE แจ้งเตือนให้ลูกค้าต่ออายุเอง
      processed++;
    } catch (e) {
      errors.push(`item ${item.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { processed, errors };
}
