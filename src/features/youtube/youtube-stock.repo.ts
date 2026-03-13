import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { accountStock } from "@/db/schema/account-stock.schema";
import { customerAccounts } from "@/db/schema/customer-account.schema";
import { familyGroups, familyMembers } from "@/db/schema/family.schema";
import { inviteLinks } from "@/db/schema/invite-link.schema";

export async function findAccountStocks(limit = 100) {
  return db.select().from(accountStock).orderBy(desc(accountStock.createdAt)).limit(limit);
}

export async function createAccountStock(data: {
  email: string;
  password: string;
  status?: "available" | "reserved" | "sold";
}) {
  const [row] = await db
    .insert(accountStock)
    .values({
      email: data.email,
      password: data.password,
      status: data.status ?? "available",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return row ?? null;
}

export async function updateAccountStockStatus(
  id: number,
  status: "available" | "reserved" | "sold"
) {
  const [row] = await db
    .update(accountStock)
    .set({
      status,
      soldAt: status === "sold" ? new Date() : null,
      reservedAt: status === "reserved" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(accountStock.id, id))
    .returning();
  return row ?? null;
}

export async function deleteAccountStockById(id: number) {
  const [row] = await db.delete(accountStock).where(eq(accountStock.id, id)).returning({ id: accountStock.id });
  return row != null;
}

export async function findFamilyGroupsWithMembers() {
  const groups = await db.select().from(familyGroups).orderBy(desc(familyGroups.createdAt));
  if (groups.length === 0) return { groups: [], membersByGroup: {} as Record<number, typeof familyMembers.$inferSelect[]> };

  const ids = groups.map((g) => g.id);
  const members = await db.select().from(familyMembers).where(inArray(familyMembers.familyGroupId, ids));
  const membersByGroup: Record<number, typeof familyMembers.$inferSelect[]> = {};
  for (const g of groups) membersByGroup[g.id] = [];
  for (const m of members) membersByGroup[m.familyGroupId].push(m);
  return { groups, membersByGroup };
}

export async function createFamilyGroup(data: { name: string; limit: number; notes?: string | null }) {
  const [row] = await db
    .insert(familyGroups)
    .values({
      name: data.name,
      limit: data.limit,
      used: 0,
      notes: data.notes ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return row ?? null;
}

export async function deleteFamilyGroupById(id: number) {
  const [row] = await db.delete(familyGroups).where(eq(familyGroups.id, id)).returning({ id: familyGroups.id });
  return row != null;
}

export async function addFamilyMember(data: {
  familyGroupId: number;
  email: string;
  customerId?: number | null;
  orderId?: number | null;
}) {
  return db.transaction(async (tx) => {
    const [group] = await tx
      .select({ id: familyGroups.id, used: familyGroups.used, limit: familyGroups.limit })
      .from(familyGroups)
      .where(eq(familyGroups.id, data.familyGroupId))
      .limit(1);
    if (!group) return null;
    if (group.used >= group.limit) throw new Error("FAMILY_GROUP_FULL");

    const [member] = await tx
      .insert(familyMembers)
      .values({
        familyGroupId: data.familyGroupId,
        email: data.email,
        customerId: data.customerId ?? null,
        orderId: data.orderId ?? null,
        createdAt: new Date(),
      })
      .returning();

    await tx
      .update(familyGroups)
      .set({
        used: group.used + 1,
        updatedAt: new Date(),
      })
      .where(eq(familyGroups.id, data.familyGroupId));

    return member ?? null;
  });
}

export async function removeFamilyMemberById(id: number) {
  return db.transaction(async (tx) => {
    const [member] = await tx
      .select()
      .from(familyMembers)
      .where(eq(familyMembers.id, id))
      .limit(1);
    if (!member) return false;

    await tx.delete(familyMembers).where(eq(familyMembers.id, id));
    await tx
      .update(familyGroups)
      .set({
        used: sql`CASE WHEN ${familyGroups.used} > 0 THEN ${familyGroups.used} - 1 ELSE 0 END`,
        updatedAt: new Date(),
      })
      .where(eq(familyGroups.id, member.familyGroupId));
    return true;
  });
}

export async function findInviteLinks(limit = 200) {
  return db.select().from(inviteLinks).orderBy(desc(inviteLinks.createdAt)).limit(limit);
}

export async function createInviteLink(data: {
  link: string;
  status?: "available" | "reserved" | "used";
}) {
  const [row] = await db
    .insert(inviteLinks)
    .values({
      link: data.link,
      status: data.status ?? "available",
      createdAt: new Date(),
    })
    .returning();
  return row ?? null;
}

export async function updateInviteLinkStatus(
  id: number,
  status: "available" | "reserved" | "used"
) {
  const [row] = await db
    .update(inviteLinks)
    .set({
      status,
      reservedAt: status === "reserved" ? new Date() : null,
      usedAt: status === "used" ? new Date() : null,
    })
    .where(eq(inviteLinks.id, id))
    .returning();
  return row ?? null;
}

export async function deleteInviteLinkById(id: number) {
  const [row] = await db.delete(inviteLinks).where(eq(inviteLinks.id, id)).returning({ id: inviteLinks.id });
  return row != null;
}

export async function findCustomerAccounts(limit = 200) {
  return db.select().from(customerAccounts).orderBy(desc(customerAccounts.createdAt)).limit(limit);
}

export async function updateCustomerAccountStatus(
  id: number,
  status: "pending" | "processing" | "done",
  notes?: string | null
) {
  const payload: Partial<typeof customerAccounts.$inferInsert> = {
    status,
    updatedAt: new Date(),
  };
  if (notes !== undefined) payload.notes = notes;
  const [row] = await db
    .update(customerAccounts)
    .set(payload)
    .where(eq(customerAccounts.id, id))
    .returning();
  return row ?? null;
}

export async function deleteCustomerAccountById(id: number) {
  const [row] = await db
    .delete(customerAccounts)
    .where(eq(customerAccounts.id, id))
    .returning({ id: customerAccounts.id });
  return row != null;
}

