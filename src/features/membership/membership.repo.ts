import { asc, desc, eq, and, gt } from "drizzle-orm";
import { db } from "@/db";
import {
  membershipPlans,
  customerMemberships,
  type BillingType,
  type MembershipStatus,
} from "@/db/schema/membership.schema";

export type MembershipPlanRow = typeof membershipPlans.$inferSelect;
export type MembershipPlanInsert = typeof membershipPlans.$inferInsert;

export type CustomerMembershipRow = typeof customerMemberships.$inferSelect;
export type CustomerMembershipInsert = typeof customerMemberships.$inferInsert;

export type { BillingType, MembershipStatus };

/** แผนสมาชิกพร้อมใช้แสดง/แก้ไข */
export type MembershipPlanWithBenefits = MembershipPlanRow & {
  freeRentalDays: number;
  discountPercent: number;
  description: string | null;
};

/** ดึงแผนทั้งหมด (เรียงตาม sortOrder, แสดงเฉพาะที่เปิดใช้ได้ถ้า activeOnly) */
export async function findMembershipPlans(activeOnly = false): Promise<MembershipPlanRow[]> {
  if (activeOnly) {
    return db
      .select()
      .from(membershipPlans)
      .where(eq(membershipPlans.isActive, true))
      .orderBy(asc(membershipPlans.sortOrder), asc(membershipPlans.id));
  }
  return db
    .select()
    .from(membershipPlans)
    .orderBy(asc(membershipPlans.sortOrder), asc(membershipPlans.id));
}

/** ดึงแผนตาม id */
export async function findMembershipPlanById(id: number): Promise<MembershipPlanRow | null> {
  const [row] = await db.select().from(membershipPlans).where(eq(membershipPlans.id, id)).limit(1);
  return row ?? null;
}

/** สร้าง/อัปเดตแผน */
export async function upsertMembershipPlan(data: {
  id?: number;
  name: string;
  billingType: BillingType;
  price: number;
  freeRentalDays?: number;
  discountPercent?: number;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<MembershipPlanRow> {
  const payload = {
    name: data.name.trim(),
    billingType: data.billingType,
    price: data.price,
    freeRentalDays: data.freeRentalDays ?? 0,
    discountPercent: data.discountPercent ?? 0,
    description: data.description?.trim() || null,
    sortOrder: data.sortOrder ?? 0,
    isActive: data.isActive ?? true,
  };
  if (data.id) {
    await db
      .update(membershipPlans)
      .set(payload)
      .where(eq(membershipPlans.id, data.id));
    const plan = await findMembershipPlanById(data.id);
    if (!plan) throw new Error("Plan not found after update");
    return plan;
  }
  const [inserted] = await db.insert(membershipPlans).values(payload).returning();
  if (!inserted) throw new Error("Insert plan failed");
  return inserted;
}

/** ลบแผน */
export async function deleteMembershipPlan(id: number): Promise<boolean> {
  const [row] = await db
    .delete(membershipPlans)
    .where(eq(membershipPlans.id, id))
    .returning({ id: membershipPlans.id });
  return !!row;
}

/** สมาชิกภาพที่ active ของลูกค้า (ใช้ customerId) */
export async function findActiveMembershipByCustomerId(
  customerId: number
): Promise<(CustomerMembershipRow & { plan: MembershipPlanRow }) | null> {
  const now = new Date();
  const rows = await db
    .select()
    .from(customerMemberships)
    .innerJoin(membershipPlans, eq(customerMemberships.planId, membershipPlans.id))
    .where(
      and(
        eq(customerMemberships.customerId, customerId),
        eq(customerMemberships.status, "active"),
        gt(customerMemberships.expiresAt, now)
      )
    )
    .orderBy(asc(customerMemberships.expiresAt))
    .limit(1);
  if (rows.length === 0) return null;
  const { customer_memberships, membership_plans } = rows[0];
  return { ...customer_memberships, plan: membership_plans };
}

/** สมาชิกภาพที่ active ตามอีเมล (สำหรับตอนเช็ค-out ไม่ได้ล็อกอินด้วย customerId) */
export async function findActiveMembershipByEmail(
  email: string
): Promise<(CustomerMembershipRow & { plan: MembershipPlanRow }) | null> {
  const { customers } = await import("@/db/schema/customer.schema");
  const rows = await db
    .select()
    .from(customerMemberships)
    .innerJoin(membershipPlans, eq(customerMemberships.planId, membershipPlans.id))
    .innerJoin(customers, eq(customerMemberships.customerId, customers.id))
    .where(
      and(
        eq(customers.email, email.toLowerCase().trim()),
        eq(customerMemberships.status, "active"),
        gt(customerMemberships.expiresAt, new Date())
      )
    )
    .orderBy(asc(customerMemberships.expiresAt))
    .limit(1);
  if (rows.length === 0) return null;
  const { customer_memberships, membership_plans } = rows[0];
  return { ...customer_memberships, plan: membership_plans };
}

/** บันทึกการสมัครสมาชิก (หลังชำระเงินแล้ว) */
export async function createCustomerMembership(data: {
  customerId: number;
  planId: number;
  startedAt: Date;
  expiresAt: Date;
}): Promise<CustomerMembershipRow> {
  const [row] = await db
    .insert(customerMemberships)
    .values({
      customerId: data.customerId,
      planId: data.planId,
      status: "active",
      startedAt: data.startedAt,
      expiresAt: data.expiresAt,
    })
    .returning();
  if (!row) throw new Error("Insert customer_membership failed");
  return row;
}

/** ประวัติการสมัครสมาชิกของลูกค้า (เรียงจากใหม่ไปเก่า) */
export async function findCustomerMembershipsByCustomerId(
  customerId: number,
  limit = 50
): Promise<(CustomerMembershipRow & { plan: MembershipPlanRow })[]> {
  const rows = await db
    .select()
    .from(customerMemberships)
    .innerJoin(membershipPlans, eq(customerMemberships.planId, membershipPlans.id))
    .where(eq(customerMemberships.customerId, customerId))
    .orderBy(desc(customerMemberships.createdAt))
    .limit(limit);
  return rows.map((r) => ({ ...r.customer_memberships, plan: r.membership_plans }));
}

/** รายการสมัครสมาชิกทั้งหมด (สำหรับหลังบ้าน) */
export async function findAllCustomerMemberships(limit = 100): Promise<
  (CustomerMembershipRow & {
    plan: MembershipPlanRow;
    customerEmail: string;
    customerName: string;
  })[]
> {
  const { customers } = await import("@/db/schema/customer.schema");
  const rows = await db
    .select({
      id: customerMemberships.id,
      customerId: customerMemberships.customerId,
      planId: customerMemberships.planId,
      status: customerMemberships.status,
      startedAt: customerMemberships.startedAt,
      expiresAt: customerMemberships.expiresAt,
      createdAt: customerMemberships.createdAt,
      customerEmail: customers.email,
      customerName: customers.name,
    })
    .from(customerMemberships)
    .innerJoin(membershipPlans, eq(customerMemberships.planId, membershipPlans.id))
    .innerJoin(customers, eq(customerMemberships.customerId, customers.id))
    .orderBy(desc(customerMemberships.createdAt))
    .limit(limit);
  const plans = await db.select().from(membershipPlans);
  const planMap = new Map(plans.map((p) => [p.id, p]));
  return rows.map((r) => {
    const plan = planMap.get(r.planId)!;
    return {
      id: r.id,
      customerId: r.customerId,
      planId: r.planId,
      status: r.status as MembershipStatus,
      startedAt: r.startedAt,
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
      plan,
      customerEmail: r.customerEmail,
      customerName: r.customerName,
    };
  });
}
