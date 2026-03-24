import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accountStock } from "@/db/schema/account-stock.schema";
import { familyGroups, familyMembers } from "@/db/schema/family.schema";
import { customerAccounts } from "@/db/schema/customer-account.schema";
import { customers } from "@/db/schema/customer.schema";
import { orders } from "@/db/schema/order.schema";

type SeedOrderInput = {
  orderNumber: string;
  productType: "individual" | "family" | "invite" | "customer_account";
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerId?: number | null;
  totalPrice: number;
  status?: "pending" | "paid" | "fulfilled" | "completed" | "cancelled" | "refunded";
};

async function ensureCustomer(input: {
  name: string;
  email: string;
  phone?: string | null;
}): Promise<number> {
  const [existing] = await db.select({ id: customers.id }).from(customers).where(eq(customers.email, input.email)).limit(1);
  if (existing) return existing.id;

  const [row] = await db
    .insert(customers)
    .values({
      name: input.name,
      email: input.email,
      password: "seed-password",
      phone: input.phone ?? null,
    })
    .returning({ id: customers.id });
  if (!row) throw new Error(`Failed to create customer: ${input.email}`);
  return row.id;
}

async function ensureOrder(input: SeedOrderInput): Promise<number> {
  const [existing] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.orderNumber, input.orderNumber))
    .limit(1);
  if (existing) return existing.id;

  const [row] = await db
    .insert(orders)
    .values({
      orderNumber: input.orderNumber,
      status: input.status ?? "paid",
      productType: input.productType,
      customerId: input.customerId ?? null,
      totalPrice: input.totalPrice,
      depositAmount: 0,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({ id: orders.id });
  if (!row) throw new Error(`Failed to create order: ${input.orderNumber}`);
  return row.id;
}

async function seedAccountStock(seedOrderIds: { soldIndividual: number; reservedIndividual: number }) {
  const samples = [
    { email: "yt-indi-001@example.com", password: "pass001", status: "available" as const, orderId: null },
    { email: "yt-indi-002@example.com", password: "pass002", status: "available" as const, orderId: null },
    { email: "yt-indi-003@example.com", password: "pass003", status: "available" as const, orderId: null },
    { email: "yt-indi-004@example.com", password: "pass004", status: "reserved" as const, orderId: seedOrderIds.reservedIndividual },
    { email: "yt-indi-005@example.com", password: "pass005", status: "sold" as const, orderId: seedOrderIds.soldIndividual },
  ];

  let added = 0;
  for (const item of samples) {
    const [exists] = await db.select({ id: accountStock.id }).from(accountStock).where(eq(accountStock.email, item.email)).limit(1);
    if (exists) continue;
    const now = new Date();
    await db.insert(accountStock).values({
      email: item.email,
      password: item.password,
      status: item.status,
      orderId: item.orderId,
      reservedAt: item.status === "reserved" ? now : null,
      soldAt: item.status === "sold" ? now : null,
      createdAt: now,
      updatedAt: now,
    });
    added++;
  }
  console.log("  + account_stock:", added, "rows");
}

async function seedFamilyStock(seedOrderIds: { family1: number; family2: number }) {
  const families = [
    {
      name: "YT Family Group A",
      limit: 6,
      notes: "Seed group A",
      headEmail: "family-head-a@example.com",
      headPassword: "head-pass-a",
    },
    {
      name: "YT Family Group B",
      limit: 6,
      notes: "Seed group B",
      headEmail: "family-head-b@example.com",
      headPassword: "head-pass-b",
    },
  ];

  const familyIdByName = new Map<string, number>();
  for (const family of families) {
    const [existing] = await db.select({ id: familyGroups.id }).from(familyGroups).where(eq(familyGroups.name, family.name)).limit(1);
    if (existing) {
      familyIdByName.set(family.name, existing.id);
      continue;
    }
    const [row] = await db
      .insert(familyGroups)
      .values({
        name: family.name,
        headEmail: family.headEmail,
        headPassword: family.headPassword,
        limit: family.limit,
        used: 0,
        notes: family.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: familyGroups.id });
    if (row) familyIdByName.set(family.name, row.id);
  }

  for (const family of families) {
    await db
      .update(familyGroups)
      .set({
        headEmail: family.headEmail,
        headPassword: family.headPassword,
        updatedAt: new Date(),
      })
      .where(eq(familyGroups.name, family.name));
  }

  const members = [
    {
      familyName: "YT Family Group A",
      email: "family-slot-a1@example.com",
      memberPassword: "family-member-pass-1",
      orderId: seedOrderIds.family1,
    },
    {
      familyName: "YT Family Group A",
      email: "family-slot-a2@example.com",
      memberPassword: "family-member-pass-2",
      orderId: seedOrderIds.family2,
    },
  ];

  let addedMembers = 0;
  for (const member of members) {
    const familyId = familyIdByName.get(member.familyName);
    if (!familyId) continue;
    const [exists] = await db
      .select({ id: familyMembers.id })
      .from(familyMembers)
      .where(and(eq(familyMembers.familyGroupId, familyId), eq(familyMembers.email, member.email)))
      .limit(1);
    if (exists) continue;
    await db.insert(familyMembers).values({
      familyGroupId: familyId,
      email: member.email,
      memberPassword: member.memberPassword,
      customerId: null,
      orderId: member.orderId,
      createdAt: new Date(),
    });
    addedMembers++;
  }

  for (const familyId of familyIdByName.values()) {
    const rows = await db
      .select({ id: familyMembers.id })
      .from(familyMembers)
      .where(eq(familyMembers.familyGroupId, familyId));
    await db.update(familyGroups).set({ used: rows.length, updatedAt: new Date() }).where(eq(familyGroups.id, familyId));
  }

  console.log("  + family_groups:", familyIdByName.size, "groups (upsert)");
  console.log("  + family_members:", addedMembers, "rows");
}

/** ลิงก์เชิญสำหรับสินค้า Invite — เก็บใน family_members (กลุ่มเดียวกับ Family) */
async function seedFamilyInviteSlots(seedOrderIds: { reservedInvite: number; usedInvite: number }) {
  const [family] = await db
    .select({ id: familyGroups.id })
    .from(familyGroups)
    .where(eq(familyGroups.name, "YT Family Group A"))
    .limit(1);
  if (!family) {
    console.log("  + family_members (invite slots): skip (no YT Family Group A)");
    return;
  }

  const slots = [
    {
      email: "invite-slot-seed-1@example.com",
      inviteLink: "https://youtube.com/invite/seed-001",
      orderId: null as number | null,
    },
    {
      email: "invite-slot-seed-2@example.com",
      inviteLink: "https://youtube.com/invite/seed-002",
      orderId: seedOrderIds.reservedInvite,
    },
    {
      email: "invite-slot-seed-3@example.com",
      inviteLink: "https://youtube.com/invite/seed-003",
      orderId: seedOrderIds.usedInvite,
    },
  ];

  let added = 0;
  for (const s of slots) {
    const [exists] = await db
      .select({ id: familyMembers.id })
      .from(familyMembers)
      .where(and(eq(familyMembers.familyGroupId, family.id), eq(familyMembers.email, s.email)))
      .limit(1);
    if (exists) continue;
    await db.insert(familyMembers).values({
      familyGroupId: family.id,
      email: s.email,
      memberPassword: null,
      inviteLink: s.inviteLink,
      customerId: null,
      orderId: s.orderId,
      createdAt: new Date(),
    });
    added++;
  }

  const rows = await db
    .select({ id: familyMembers.id })
    .from(familyMembers)
    .where(eq(familyMembers.familyGroupId, family.id));
  await db
    .update(familyGroups)
    .set({ used: rows.length, updatedAt: new Date() })
    .where(eq(familyGroups.id, family.id));

  console.log("  + family_members (invite slots):", added, "rows");
}

async function seedCustomerAccounts(seedOrderIds: { caPending: number; caProcessing: number; caDone: number }) {
  const customerId = await ensureCustomer({
    name: "Customer Account Seeder",
    email: "customer-account-seed@example.com",
    phone: "080-000-0000",
  });

  const samples = [
    {
      email: "seed-customer-acc-1@example.com",
      password: "customer-pass-1",
      orderId: seedOrderIds.caPending,
      status: "pending" as const,
      notes: "รอล็อกอินเพื่ออัปเกรด",
    },
    {
      email: "seed-customer-acc-2@example.com",
      password: "customer-pass-2",
      orderId: seedOrderIds.caProcessing,
      status: "processing" as const,
      notes: "กำลังดำเนินการ",
    },
    {
      email: "seed-customer-acc-3@example.com",
      password: "customer-pass-3",
      orderId: seedOrderIds.caDone,
      status: "done" as const,
      notes: "อัปเกรดเสร็จแล้ว",
    },
  ];

  let added = 0;
  for (const item of samples) {
    const [exists] = await db
      .select({ id: customerAccounts.id })
      .from(customerAccounts)
      .where(and(eq(customerAccounts.customerId, customerId), eq(customerAccounts.email, item.email)))
      .limit(1);
    if (exists) continue;

    await db.insert(customerAccounts).values({
      customerId,
      email: item.email,
      password: item.password,
      orderId: item.orderId,
      status: item.status,
      notes: item.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    added++;
  }
  console.log("  + customer_accounts:", added, "rows");
}

export async function seedStocks(): Promise<void> {
  console.log("Seeding stock tables...");

  const individualCustomerId = await ensureCustomer({
    name: "Seed Individual Buyer",
    email: "seed-individual@example.com",
    phone: "081-111-1111",
  });
  const familyCustomerId = await ensureCustomer({
    name: "Seed Family Buyer",
    email: "seed-family@example.com",
    phone: "082-222-2222",
  });
  const inviteCustomerId = await ensureCustomer({
    name: "Seed Invite Buyer",
    email: "seed-invite@example.com",
    phone: "083-333-3333",
  });
  const customerAccCustomerId = await ensureCustomer({
    name: "Seed Customer Account Buyer",
    email: "seed-customer-account@example.com",
    phone: "084-444-4444",
  });

  const soldIndividual = await ensureOrder({
    orderNumber: "SEED-INDI-SOLD-001",
    productType: "individual",
    customerName: "Seed Individual Buyer",
    customerEmail: "seed-individual@example.com",
    customerId: individualCustomerId,
    totalPrice: 79,
    status: "paid",
  });
  const reservedIndividual = await ensureOrder({
    orderNumber: "SEED-INDI-RES-001",
    productType: "individual",
    customerName: "Seed Individual Buyer",
    customerEmail: "seed-individual@example.com",
    customerId: individualCustomerId,
    totalPrice: 79,
    status: "pending",
  });
  const family1 = await ensureOrder({
    orderNumber: "SEED-FAM-001",
    productType: "family",
    customerName: "Seed Family Buyer",
    customerEmail: "seed-family@example.com",
    customerId: familyCustomerId,
    totalPrice: 129,
    status: "paid",
  });
  const family2 = await ensureOrder({
    orderNumber: "SEED-FAM-002",
    productType: "family",
    customerName: "Seed Family Buyer",
    customerEmail: "seed-family@example.com",
    customerId: familyCustomerId,
    totalPrice: 129,
    status: "paid",
  });
  const reservedInvite = await ensureOrder({
    orderNumber: "SEED-INV-RES-001",
    productType: "invite",
    customerName: "Seed Invite Buyer",
    customerEmail: "seed-invite@example.com",
    customerId: inviteCustomerId,
    totalPrice: 119,
    status: "pending",
  });
  const usedInvite = await ensureOrder({
    orderNumber: "SEED-INV-USED-001",
    productType: "invite",
    customerName: "Seed Invite Buyer",
    customerEmail: "seed-invite@example.com",
    customerId: inviteCustomerId,
    totalPrice: 119,
    status: "paid",
  });
  const caPending = await ensureOrder({
    orderNumber: "SEED-CA-PENDING-001",
    productType: "customer_account",
    customerName: "Seed Customer Account Buyer",
    customerEmail: "seed-customer-account@example.com",
    customerId: customerAccCustomerId,
    totalPrice: 99,
    status: "paid",
  });
  const caProcessing = await ensureOrder({
    orderNumber: "SEED-CA-PROCESS-001",
    productType: "customer_account",
    customerName: "Seed Customer Account Buyer",
    customerEmail: "seed-customer-account@example.com",
    customerId: customerAccCustomerId,
    totalPrice: 99,
    status: "paid",
  });
  const caDone = await ensureOrder({
    orderNumber: "SEED-CA-DONE-001",
    productType: "customer_account",
    customerName: "Seed Customer Account Buyer",
    customerEmail: "seed-customer-account@example.com",
    customerId: customerAccCustomerId,
    totalPrice: 99,
    status: "fulfilled",
  });

  await seedAccountStock({ soldIndividual, reservedIndividual });
  await seedFamilyStock({ family1, family2 });
  await seedFamilyInviteSlots({ reservedInvite, usedInvite });
  await seedCustomerAccounts({ caPending, caProcessing, caDone });

  console.log("Seed stocks done.");
}

const isMain = process.argv[1]?.replace(/\\/g, "/").endsWith("seed-stocks.ts");
if (isMain) {
  seedStocks().catch((e) => {
    console.error("Seed stocks failed:", e);
    process.exit(1);
  });
}
