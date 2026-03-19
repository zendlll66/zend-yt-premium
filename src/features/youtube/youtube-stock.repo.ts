import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { db } from "@/db";
import { accountStock } from "@/db/schema/account-stock.schema";
import { customerAccounts } from "@/db/schema/customer-account.schema";
import { customers } from "@/db/schema/customer.schema";
import { customerInventories } from "@/db/schema/customer-inventory.schema";
import { familyGroups, familyMembers } from "@/db/schema/family.schema";
import { inviteLinks } from "@/db/schema/invite-link.schema";
import { orders } from "@/db/schema/order.schema";

const familyGroupsLegacy = sqliteTable("family_groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  limit: integer("limit").notNull(),
  used: integer("used").notNull().default(0),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

let familyGroupColumnSupportCache: { headAccount: boolean } | null = null;

export type FamilyMemberWithStatus = {
  id: number;
  familyGroupId: number;
  customerId: number | null;
  email: string;
  memberPassword: string | null;
  orderId: number | null;
  createdAt: Date;
  expiresAt: Date | null;
  memberStatus: "available" | "released" | "in_use";
  orderStatus: string | null;
  customerIdResolved: number | null;
  customerName: string | null;
  customerEmail: string | null;
  customerLineDisplayName: string | null;
  customerLinePictureUrl: string | null;
};

async function getFamilyGroupColumnSupport(): Promise<{ headAccount: boolean }> {
  if (familyGroupColumnSupportCache?.headAccount) return familyGroupColumnSupportCache;
  try {
    const client = db as unknown as {
      $client?: { execute?: (query: string) => Promise<{ rows?: Array<Record<string, unknown>> }> };
    };
    const result = await client.$client?.execute?.('PRAGMA table_info("family_groups")');
    const rows = (result?.rows ?? []) as Array<Record<string, unknown>>;
    const names = new Set(rows.map((r) => String(r.name ?? "")));
    const headAccount = names.has("head_email") && names.has("head_password");
    familyGroupColumnSupportCache = { headAccount };
    return { headAccount };
  } catch {
    return { headAccount: false };
  }
}

export async function findAccountStocks(limit = 100) {
  const rows = await db
    .select({
      id: accountStock.id,
      email: accountStock.email,
      password: accountStock.password,
      status: accountStock.status,
      orderId: accountStock.orderId,
      reservedAt: accountStock.reservedAt,
      soldAt: accountStock.soldAt,
      expiresAt: customerInventories.expiresAt,
      createdAt: accountStock.createdAt,
      updatedAt: accountStock.updatedAt,
      customerId: customers.id,
      customerName: customers.name,
      customerEmail: customers.email,
      customerLineDisplayName: customers.lineDisplayName,
      customerLinePictureUrl: customers.linePictureUrl,
    })
    .from(accountStock)
    .leftJoin(orders, eq(accountStock.orderId, orders.id))
    .leftJoin(
      customerInventories,
      and(
        eq(customerInventories.orderId, accountStock.orderId),
        eq(customerInventories.itemType, "individual"),
        // ป้องกัน row ซ้ำ: ผูกเฉพาะ inventory แถวของ account นี้ด้วย loginEmail
        // (accountStock.email มักเท่ากับ customer_inventories.login_email)
        eq(customerInventories.loginEmail, accountStock.email)
      )
    )
    .leftJoin(
      customers,
      or(
        eq(accountStock.customerId, customers.id),
        and(isNull(accountStock.customerId), eq(orders.customerId, customers.id))
      )
    )
    .orderBy(desc(accountStock.createdAt))
    .limit(limit);

  // กันกรณี join ทำให้ได้ row ซ้ำ id เดิม (React key ต้อง unique)
  const byId = new Map<number, (typeof rows)[number]>();
  for (const row of rows) {
    const prev = byId.get(row.id);
    if (!prev) {
      byId.set(row.id, row);
      continue;
    }
    // เลือก expiresAt ที่มากสุด (ล่าสุด) เผื่อมี inventory ซ้ำหลายแถว
    if (row.expiresAt) {
      if (!prev.expiresAt || row.expiresAt > prev.expiresAt) {
        byId.set(row.id, row);
      }
    }
  }

  return Array.from(byId.values()).sort(
    (a, b) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0)
  );
}

export async function findAccountStockById(id: number) {
  const [row] = await db
    .select({
      id: accountStock.id,
      email: accountStock.email,
      password: accountStock.password,
      status: accountStock.status,
      orderId: accountStock.orderId,
      customerId: accountStock.customerId,
      reservedAt: accountStock.reservedAt,
      soldAt: accountStock.soldAt,
      createdAt: accountStock.createdAt,
      updatedAt: accountStock.updatedAt,
    })
    .from(accountStock)
    .where(eq(accountStock.id, id))
    .limit(1);
  return row ?? null;
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

export async function updateAccountStockById(data: {
  id: number;
  email: string;
  password: string;
  status: "available" | "reserved" | "sold";
  orderId?: number | null;
  customerId?: number | null;
  reservedAt?: Date | null;
  soldAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}) {
  const now = new Date();
  const [row] = await db
    .update(accountStock)
    .set({
      email: data.email,
      password: data.password,
      status: data.status,
      orderId: data.orderId !== undefined ? data.orderId : undefined,
      customerId: data.customerId !== undefined ? data.customerId : undefined,
      reservedAt: data.reservedAt !== undefined ? data.reservedAt : undefined,
      soldAt: data.soldAt !== undefined ? data.soldAt : undefined,
      createdAt: data.createdAt != null ? data.createdAt : undefined,
      updatedAt: data.updatedAt != null ? data.updatedAt : now,
    })
    .where(eq(accountStock.id, data.id))
    .returning();
  return row ?? null;
}

export async function deleteAccountStockById(id: number) {
  const [row] = await db.delete(accountStock).where(eq(accountStock.id, id)).returning({ id: accountStock.id });
  return row != null;
}

export async function findFamilyGroupsWithMembers() {
  const columnSupport = await getFamilyGroupColumnSupport();
  const groups = columnSupport.headAccount
    ? await db.select().from(familyGroups).orderBy(desc(familyGroups.createdAt))
    : await db
        .select()
        .from(familyGroupsLegacy)
        .orderBy(desc(familyGroupsLegacy.createdAt))
        .then((rows) => rows.map((r) => ({ ...r, headEmail: null, headPassword: null })));
  if (groups.length === 0) return { groups: [], membersByGroup: {} as Record<number, FamilyMemberWithStatus[]> };

  const ids = groups.map((g) => g.id);
  const membersBase = await db
    .select({
      id: familyMembers.id,
      familyGroupId: familyMembers.familyGroupId,
      customerId: familyMembers.customerId,
      email: familyMembers.email,
      memberPassword: familyMembers.memberPassword,
      orderId: familyMembers.orderId,
      createdAt: familyMembers.createdAt,
    })
    .from(familyMembers)
    .where(inArray(familyMembers.familyGroupId, ids));

  const orderIds = [...new Set(membersBase.map((m) => m.orderId).filter((id): id is number => id != null))];
  const orderRows =
    orderIds.length === 0
      ? []
      : await db
          .select({
            id: orders.id,
            status: orders.status,
            customerId: orders.customerId,
            customerEmail: orders.customerEmail,
          })
          .from(orders)
          .where(inArray(orders.id, orderIds));
  const orderById = new Map(orderRows.map((o) => [o.id, o]));

  const expiresByOrderId = new Map<number, Date | null>();
  if (orderIds.length > 0) {
    const invRows = await db
      .select({
        orderId: customerInventories.orderId,
        expiresAt: customerInventories.expiresAt,
      })
      .from(customerInventories)
      .where(and(inArray(customerInventories.orderId, orderIds), eq(customerInventories.itemType, "family")));
    for (const r of invRows) {
      if (r.orderId != null) expiresByOrderId.set(r.orderId, r.expiresAt ?? null);
    }
  }

  const customerIds = [
    ...new Set(
      [
        ...membersBase.map((m) => m.customerId),
        ...orderRows.map((o) => o.customerId),
      ].filter((id): id is number => id != null)
    ),
  ];
  const customersByIdRows =
    customerIds.length === 0
      ? []
      : await db
          .select({
            id: customers.id,
            name: customers.name,
            email: customers.email,
            lineDisplayName: customers.lineDisplayName,
            linePictureUrl: customers.linePictureUrl,
          })
          .from(customers)
          .where(inArray(customers.id, customerIds));
  const customersById = new Map(customersByIdRows.map((c) => [c.id, c]));

  const orderCustomerEmails = [
    ...new Set(orderRows.map((o) => o.customerEmail).filter((email): email is string => !!email)),
  ];
  const customersByEmailRows =
    orderCustomerEmails.length === 0
      ? []
      : await db
          .select({
            id: customers.id,
            name: customers.name,
            email: customers.email,
            lineDisplayName: customers.lineDisplayName,
            linePictureUrl: customers.linePictureUrl,
          })
          .from(customers)
          .where(inArray(customers.email, orderCustomerEmails));
  const customersByEmail = new Map(customersByEmailRows.map((c) => [c.email, c]));

  const members: FamilyMemberWithStatus[] = membersBase.map((m) => {
    const linkedOrder = m.orderId ? orderById.get(m.orderId) : undefined;
    const fromMemberId = m.customerId ? customersById.get(m.customerId) : undefined;
    const fromOrderId = linkedOrder?.customerId ? customersById.get(linkedOrder.customerId) : undefined;
    const fromOrderEmail = linkedOrder?.customerEmail
      ? customersByEmail.get(linkedOrder.customerEmail)
      : undefined;
    const customer = fromMemberId ?? fromOrderId ?? fromOrderEmail;

    const memberStatus =
      !m.orderId
        ? "available"
        : linkedOrder?.status === "cancelled" || linkedOrder?.status === "refunded"
          ? "released"
          : "in_use";

    return {
      ...m,
      expiresAt: m.orderId ? (expiresByOrderId.get(m.orderId) ?? null) : null,
      memberStatus,
      orderStatus: linkedOrder?.status ?? null,
      customerIdResolved: customer?.id ?? null,
      customerName: customer?.name ?? null,
      customerEmail: customer?.email ?? null,
      customerLineDisplayName: customer?.lineDisplayName ?? null,
      customerLinePictureUrl: customer?.linePictureUrl ?? null,
    } as FamilyMemberWithStatus;
  });

  const membersByGroup: Record<number, FamilyMemberWithStatus[]> = {};
  for (const g of groups) membersByGroup[g.id] = [];
  for (const m of members) membersByGroup[m.familyGroupId].push(m);
  return { groups, membersByGroup };
}

export async function createFamilyGroup(data: {
  name: string;
  limit: number;
  notes?: string | null;
  headEmail?: string | null;
  headPassword?: string | null;
}) {
  const columnSupport = await getFamilyGroupColumnSupport();
  if (!columnSupport.headAccount) {
    const [row] = await db
      .insert(familyGroupsLegacy)
      .values({
        name: data.name,
        limit: data.limit,
        used: 0,
        notes: data.notes ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return row ? { ...row, headEmail: null, headPassword: null } : null;
  }

  const [row] = await db
    .insert(familyGroups)
    .values({
      name: data.name,
      headEmail: data.headEmail ?? null,
      headPassword: data.headPassword ?? null,
      limit: data.limit,
      used: 0,
      notes: data.notes ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return row ?? null;
}

export async function updateFamilyGroupHeadAccount(data: {
  id: number;
  headEmail?: string | null;
  headPassword?: string | null;
}) {
  const columnSupport = await getFamilyGroupColumnSupport();
  if (!columnSupport.headAccount) return null;
  const [row] = await db
    .update(familyGroups)
    .set({
      headEmail: data.headEmail ?? null,
      headPassword: data.headPassword ?? null,
      updatedAt: new Date(),
    })
    .where(eq(familyGroups.id, data.id))
    .returning();
  return row ?? null;
}

export async function updateFamilyGroupById(data: {
  id: number;
  name: string;
  limit: number;
  notes?: string | null;
  headEmail?: string | null;
  headPassword?: string | null;
}) {
  const columnSupport = await getFamilyGroupColumnSupport();
  if (!columnSupport.headAccount) {
    const [row] = await db
      .update(familyGroupsLegacy)
      .set({
        name: data.name,
        limit: data.limit,
        notes: data.notes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(familyGroupsLegacy.id, data.id))
      .returning();
    return row ? { ...row, headEmail: null, headPassword: null } : null;
  }
  const [row] = await db
    .update(familyGroups)
    .set({
      name: data.name,
      limit: data.limit,
      notes: data.notes ?? null,
      headEmail: data.headEmail ?? null,
      headPassword: data.headPassword ?? null,
      updatedAt: new Date(),
    })
    .where(eq(familyGroups.id, data.id))
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
  memberPassword: string;
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
        memberPassword: data.memberPassword,
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

export async function updateFamilyMemberById(data: {
  id: number;
  email: string;
  memberPassword: string;
  orderId?: number | null;
  customerId?: number | null;
}) {
  const [row] = await db
    .update(familyMembers)
    .set({
      email: data.email,
      memberPassword: data.memberPassword,
      ...(data.orderId !== undefined && { orderId: data.orderId }),
      ...(data.customerId !== undefined && { customerId: data.customerId }),
    })
    .where(eq(familyMembers.id, data.id))
    .returning();
  return row ?? null;
}

export async function findFamilyMemberById(id: number) {
  const [row] = await db
    .select({
      id: familyMembers.id,
      familyGroupId: familyMembers.familyGroupId,
      email: familyMembers.email,
      memberPassword: familyMembers.memberPassword,
      orderId: familyMembers.orderId,
      customerId: familyMembers.customerId,
    })
    .from(familyMembers)
    .where(eq(familyMembers.id, id))
    .limit(1);
  return row ?? null;
}

export async function findInviteLinkById(id: number) {
  const [row] = await db
    .select({
      id: inviteLinks.id,
      link: inviteLinks.link,
      status: inviteLinks.status,
      orderId: inviteLinks.orderId,
      customerId: inviteLinks.customerId,
      reservedAt: inviteLinks.reservedAt,
      usedAt: inviteLinks.usedAt,
      createdAt: inviteLinks.createdAt,
    })
    .from(inviteLinks)
    .where(eq(inviteLinks.id, id))
    .limit(1);
  return row ?? null;
}

export async function findInviteLinks(limit = 200) {
  const rows = await db
    .select({
      id: inviteLinks.id,
      link: inviteLinks.link,
      status: inviteLinks.status,
      orderId: inviteLinks.orderId,
      reservedAt: inviteLinks.reservedAt,
      usedAt: inviteLinks.usedAt,
      expiresAt: customerInventories.expiresAt,
      createdAt: inviteLinks.createdAt,
      customerId: customers.id,
      customerName: customers.name,
      customerEmail: customers.email,
      customerLineDisplayName: customers.lineDisplayName,
      customerLinePictureUrl: customers.linePictureUrl,
    })
    .from(inviteLinks)
    .leftJoin(orders, eq(inviteLinks.orderId, orders.id))
    .leftJoin(
      customerInventories,
      and(
        eq(customerInventories.orderId, inviteLinks.orderId),
        eq(customerInventories.itemType, "invite"),
        // ผูกด้วย inviteLink string เพื่อลดโอกาส join ซ้ำ
        eq(customerInventories.inviteLink, inviteLinks.link)
      )
    )
    .leftJoin(
      customers,
      or(
        eq(inviteLinks.customerId, customers.id),
        and(isNull(inviteLinks.customerId), eq(orders.customerId, customers.id))
      )
    )
    .orderBy(desc(inviteLinks.createdAt))
    .limit(limit);

  // กันกรณี join ทำให้ได้ row ซ้ำ id เดิม (React key ต้อง unique)
  const byId = new Map<number, (typeof rows)[number]>();
  for (const row of rows) {
    const prev = byId.get(row.id);
    if (!prev) {
      byId.set(row.id, row);
      continue;
    }
    // เลือกแถวที่มี expiresAt มากกว่า (ล่าสุด) ถ้ามี
    if (row.expiresAt) {
      if (!prev.expiresAt || row.expiresAt > prev.expiresAt) {
        byId.set(row.id, row);
      }
    }
  }

  return Array.from(byId.values()).sort(
    (a, b) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0)
  );
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

export async function updateInviteLinkById(data: {
  id: number;
  link: string;
  status: "available" | "reserved" | "used";
  orderId?: number | null;
  customerId?: number | null;
  reservedAt?: Date | null;
  usedAt?: Date | null;
  createdAt?: Date | null;
}) {
  const now = new Date();
  const [row] = await db
    .update(inviteLinks)
    .set({
      link: data.link,
      status: data.status,
      ...(data.orderId !== undefined && { orderId: data.orderId }),
      ...(data.customerId !== undefined && { customerId: data.customerId }),
      reservedAt: data.reservedAt !== undefined ? data.reservedAt : data.status === "reserved" ? now : null,
      usedAt: data.usedAt !== undefined ? data.usedAt : data.status === "used" ? now : null,
      ...(data.createdAt !== undefined && data.createdAt !== null
        ? { createdAt: data.createdAt }
        : {}),
    })
    .where(eq(inviteLinks.id, data.id))
    .returning();
  return row ?? null;
}

export async function deleteInviteLinkById(id: number) {
  const [row] = await db.delete(inviteLinks).where(eq(inviteLinks.id, id)).returning({ id: inviteLinks.id });
  return row != null;
}

export async function findCustomerAccounts(limit = 200) {
  return db
    .select({
      id: customerAccounts.id,
      customerId: customerAccounts.customerId,
      email: customerAccounts.email,
      password: customerAccounts.password,
      orderId: customerAccounts.orderId,
      status: customerAccounts.status,
      notes: customerAccounts.notes,
      createdAt: customerAccounts.createdAt,
      updatedAt: customerAccounts.updatedAt,
      expiresAt: customerInventories.expiresAt,
      customerName: customers.name,
      customerEmail: customers.email,
      customerLineDisplayName: customers.lineDisplayName,
      customerLinePictureUrl: customers.linePictureUrl,
    })
    .from(customerAccounts)
    .leftJoin(
      customerInventories,
      and(
        eq(customerInventories.orderId, customerAccounts.orderId),
        eq(customerInventories.itemType, "customer_account"),
        // ผูกด้วย loginEmail (customerAccounts.email) เพื่อลด row ซ้ำ
        eq(customerInventories.loginEmail, customerAccounts.email)
      )
    )
    .leftJoin(customers, eq(customerAccounts.customerId, customers.id))
    .orderBy(desc(customerAccounts.createdAt))
    .limit(limit);
}

export async function findCustomerAccountsByOrderId(orderId: number) {
  return db
    .select({
      id: customerAccounts.id,
      status: customerAccounts.status,
      email: customerAccounts.email,
      notes: customerAccounts.notes,
      createdAt: customerAccounts.createdAt,
    })
    .from(customerAccounts)
    .where(eq(customerAccounts.orderId, orderId))
    .orderBy(desc(customerAccounts.createdAt));
}

export async function updateCustomerAccountsStatusByOrderId(
  orderId: number,
  status: "pending" | "processing" | "done",
  notes?: string | null
) {
  const payload: Partial<typeof customerAccounts.$inferInsert> = {
    status,
    updatedAt: new Date(),
  };
  if (notes !== undefined) payload.notes = notes;

  const updated = await db
    .update(customerAccounts)
    .set(payload)
    .where(eq(customerAccounts.orderId, orderId))
    .returning();
  return updated;
}

export async function findCustomerAccountById(id: number) {
  const [row] = await db
    .select({
      id: customerAccounts.id,
      customerId: customerAccounts.customerId,
      email: customerAccounts.email,
      password: customerAccounts.password,
      orderId: customerAccounts.orderId,
      status: customerAccounts.status,
      notes: customerAccounts.notes,
      createdAt: customerAccounts.createdAt,
      updatedAt: customerAccounts.updatedAt,
    })
    .from(customerAccounts)
    .where(eq(customerAccounts.id, id))
    .limit(1);
  return row ?? null;
}

export async function createCustomerAccount(data: {
  customerId: number;
  orderId: number;
  email: string;
  password: string;
  status?: "pending" | "processing" | "done";
  notes?: string | null;
}) {
  const [row] = await db
    .insert(customerAccounts)
    .values({
      customerId: data.customerId,
      orderId: data.orderId,
      email: data.email,
      password: data.password,
      status: data.status ?? "pending",
      notes: data.notes ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return row ?? null;
}

export async function findCustomerAccountNotifyTarget(id: number) {
  const [row] = await db
    .select({
      id: customerAccounts.id,
      status: customerAccounts.status,
      email: customerAccounts.email,
      notes: customerAccounts.notes,
      orderCustomerEmail: orders.customerEmail,
      lineUserId: customers.lineUserId,
    })
    .from(customerAccounts)
    .leftJoin(orders, eq(customerAccounts.orderId, orders.id))
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .where(eq(customerAccounts.id, id))
    .limit(1);

  if (!row) return null;
  if (row.lineUserId?.trim()) {
    return {
      id: row.id,
      status: row.status,
      email: row.email,
      notes: row.notes,
      lineUserId: row.lineUserId.trim(),
    };
  }

  if (!row.orderCustomerEmail) {
    return {
      id: row.id,
      status: row.status,
      email: row.email,
      notes: row.notes,
      lineUserId: null,
    };
  }

  const [byEmail] = await db
    .select({ lineUserId: customers.lineUserId })
    .from(customers)
    .where(eq(customers.email, row.orderCustomerEmail))
    .limit(1);

  return {
    id: row.id,
    status: row.status,
    email: row.email,
    notes: row.notes,
    lineUserId: byEmail?.lineUserId?.trim() ?? null,
  };
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

export async function updateCustomerAccountById(data: {
  id: number;
  email: string;
  password: string;
  status: "pending" | "processing" | "done";
  notes?: string | null;
  orderId?: number;
  customerId?: number;
}) {
  const [row] = await db
    .update(customerAccounts)
    .set({
      email: data.email,
      password: data.password,
      status: data.status,
      notes: data.notes ?? null,
      ...(data.orderId !== undefined && { orderId: data.orderId }),
      ...(data.customerId !== undefined && { customerId: data.customerId }),
      updatedAt: new Date(),
    })
    .where(eq(customerAccounts.id, data.id))
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

