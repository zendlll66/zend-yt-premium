import { db } from "@/db";
import { productWaitlist } from "@/db/schema/waitlist.schema";
import { products } from "@/db/schema/product.schema";
import { customers } from "@/db/schema/customer.schema";
import { eq, and, desc } from "drizzle-orm";

/** เพิ่มลูกค้าเข้า waitlist */
export async function addToWaitlist(productId: number, customerId: number) {
  // ตรวจสอบว่ามีอยู่แล้วหรือยัง
  const [existing] = await db
    .select({ id: productWaitlist.id })
    .from(productWaitlist)
    .where(
      and(
        eq(productWaitlist.productId, productId),
        eq(productWaitlist.customerId, customerId),
        eq(productWaitlist.status, "waiting")
      )
    )
    .limit(1);

  if (existing) return existing;

  const [row] = await db
    .insert(productWaitlist)
    .values({ productId, customerId, status: "waiting" })
    .returning();
  return row;
}

/** ยกเลิก waitlist */
export async function cancelWaitlist(productId: number, customerId: number) {
  await db
    .update(productWaitlist)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(productWaitlist.productId, productId),
        eq(productWaitlist.customerId, customerId),
        eq(productWaitlist.status, "waiting")
      )
    );
}

/** ตรวจว่าลูกค้าอยู่ใน waitlist หรือไม่ */
export async function isCustomerInWaitlist(productId: number, customerId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: productWaitlist.id })
    .from(productWaitlist)
    .where(
      and(
        eq(productWaitlist.productId, productId),
        eq(productWaitlist.customerId, customerId),
        eq(productWaitlist.status, "waiting")
      )
    )
    .limit(1);
  return !!row;
}

/** รายการ waitlist ของลูกค้า */
export async function getWaitlistByCustomer(customerId: number) {
  return db
    .select({
      id: productWaitlist.id,
      productId: productWaitlist.productId,
      productName: products.name,
      productImageUrl: products.imageUrl,
      status: productWaitlist.status,
      createdAt: productWaitlist.createdAt,
      notifiedAt: productWaitlist.notifiedAt,
    })
    .from(productWaitlist)
    .leftJoin(products, eq(productWaitlist.productId, products.id))
    .where(eq(productWaitlist.customerId, customerId))
    .orderBy(desc(productWaitlist.createdAt));
}

/** รายการ waitlist ต่อสินค้า (admin) */
export async function getWaitlistByProduct(productId: number) {
  return db
    .select({
      id: productWaitlist.id,
      customerId: productWaitlist.customerId,
      customerName: customers.name,
      customerEmail: customers.email,
      customerLineUserId: customers.lineUserId,
      status: productWaitlist.status,
      createdAt: productWaitlist.createdAt,
      notifiedAt: productWaitlist.notifiedAt,
    })
    .from(productWaitlist)
    .leftJoin(customers, eq(productWaitlist.customerId, customers.id))
    .where(and(eq(productWaitlist.productId, productId), eq(productWaitlist.status, "waiting")))
    .orderBy(productWaitlist.createdAt);
}

/** รายการ waitlist ทั้งหมด (admin overview) */
export async function listAllWaitlist() {
  return db
    .select({
      id: productWaitlist.id,
      productId: productWaitlist.productId,
      productName: products.name,
      customerId: productWaitlist.customerId,
      customerName: customers.name,
      customerEmail: customers.email,
      customerLineUserId: customers.lineUserId,
      status: productWaitlist.status,
      createdAt: productWaitlist.createdAt,
      notifiedAt: productWaitlist.notifiedAt,
    })
    .from(productWaitlist)
    .leftJoin(products, eq(productWaitlist.productId, products.id))
    .leftJoin(customers, eq(productWaitlist.customerId, customers.id))
    .where(eq(productWaitlist.status, "waiting"))
    .orderBy(desc(productWaitlist.createdAt));
}

/** อัปเดตสถานะ notified */
export async function markWaitlistNotified(ids: number[]) {
  for (const id of ids) {
    await db
      .update(productWaitlist)
      .set({ status: "notified", notifiedAt: new Date() })
      .where(eq(productWaitlist.id, id));
  }
}
