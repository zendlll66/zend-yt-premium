import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { accountStock } from "@/db/schema/account-stock.schema";
import { customerAccounts } from "@/db/schema/customer-account.schema";
import { familyGroups, familyMembers } from "@/db/schema/family.schema";
import { inviteLinks } from "@/db/schema/invite-link.schema";
import { orders, type OrderProductType } from "@/db/schema/order.schema";

type AssignContext = {
  orderId: number;
  customerId: number | null;
  customerEmail: string;
};

type AssignedStock =
  | { kind: "individual"; email: string; password: string }
  | { kind: "family"; familyGroupId: number; familyName: string }
  | { kind: "invite"; link: string }
  | { kind: "customer_account"; message: string };

const MAX_RETRIES = 5;

async function claimIndividualStock(conn: typeof db, ctx: AssignContext): Promise<AssignedStock> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const [candidate] = await conn
      .select({ id: accountStock.id })
      .from(accountStock)
      .where(eq(accountStock.status, "available"))
      .orderBy(accountStock.id)
      .limit(1);
    if (!candidate) break;

    const now = new Date();
    const [claimed] = await conn
      .update(accountStock)
      .set({
        status: "sold",
        orderId: ctx.orderId,
        soldAt: now,
        updatedAt: now,
      })
      .where(and(eq(accountStock.id, candidate.id), eq(accountStock.status, "available")))
      .returning({
        id: accountStock.id,
        email: accountStock.email,
        password: accountStock.password,
      });

    if (claimed) {
      return {
        kind: "individual",
        email: claimed.email,
        password: claimed.password,
      };
    }
  }

  throw new Error("OUT_OF_STOCK_INDIVIDUAL");
}

async function claimInviteLink(conn: typeof db, ctx: AssignContext): Promise<AssignedStock> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const [candidate] = await conn
      .select({ id: inviteLinks.id })
      .from(inviteLinks)
      .where(eq(inviteLinks.status, "available"))
      .orderBy(inviteLinks.id)
      .limit(1);
    if (!candidate) break;

    const [claimed] = await conn
      .update(inviteLinks)
      .set({
        status: "used",
        orderId: ctx.orderId,
        usedAt: new Date(),
      })
      .where(and(eq(inviteLinks.id, candidate.id), eq(inviteLinks.status, "available")))
      .returning({
        id: inviteLinks.id,
        link: inviteLinks.link,
      });

    if (claimed) {
      return {
        kind: "invite",
        link: claimed.link,
      };
    }
  }

  throw new Error("OUT_OF_STOCK_INVITE");
}

async function claimFamilySlot(conn: typeof db, ctx: AssignContext): Promise<AssignedStock> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const [family] = await conn
      .select({
        id: familyGroups.id,
        name: familyGroups.name,
      })
      .from(familyGroups)
      .where(sql`${familyGroups.used} < ${familyGroups.limit}`)
      .orderBy(familyGroups.used, familyGroups.id)
      .limit(1);

    if (!family) break;

    const [updated] = await conn
      .update(familyGroups)
      .set({
        used: sql`${familyGroups.used} + 1`,
        updatedAt: new Date(),
      })
      .where(and(eq(familyGroups.id, family.id), sql`${familyGroups.used} < ${familyGroups.limit}`))
      .returning({ id: familyGroups.id });

    if (!updated) continue;

    await conn.insert(familyMembers).values({
      familyGroupId: family.id,
      customerId: ctx.customerId,
      email: ctx.customerEmail,
      orderId: ctx.orderId,
      createdAt: new Date(),
    });

    return {
      kind: "family",
      familyGroupId: family.id,
      familyName: family.name,
    };
  }

  throw new Error("NO_FAMILY_SLOT");
}

export async function assignStockForPaidOrder(input: {
  orderId: number;
  productType: OrderProductType;
  customerId: number | null;
  customerEmail: string;
  tx?: typeof db;
}): Promise<AssignedStock> {
  const ctx: AssignContext = {
    orderId: input.orderId,
    customerId: input.customerId,
    customerEmail: input.customerEmail,
  };

  const conn = input.tx ?? db;

  if (input.productType === "individual") {
    return claimIndividualStock(conn, ctx);
  }
  if (input.productType === "family") {
    return claimFamilySlot(conn, ctx);
  }
  if (input.productType === "invite") {
    return claimInviteLink(conn, ctx);
  }
  return {
    kind: "customer_account",
    message: "waiting_for_customer_account",
  };
}

/** ผูกบัญชีที่ลูกค้าส่งมาเข้ากับ order (manual processing) */
export async function createCustomerAccountForOrder(
  ctx: AssignContext,
  payload: { email: string; password: string }
) {
  const [order] = await db
    .select({
      id: orders.id,
      productType: orders.productType,
      status: orders.status,
      customerId: orders.customerId,
    })
    .from(orders)
    .where(eq(orders.id, ctx.orderId))
    .limit(1);

  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.productType !== "customer_account") throw new Error("ORDER_PRODUCT_TYPE_MISMATCH");
  if (!order.customerId) throw new Error("ORDER_CUSTOMER_REQUIRED");

  const [existing] = await db
    .select({ id: customerAccounts.id })
    .from(customerAccounts)
    .where(eq(customerAccounts.orderId, ctx.orderId))
    .limit(1);
  if (existing) throw new Error("CUSTOMER_ACCOUNT_ALREADY_SUBMITTED");

  const [row] = await db
    .insert(customerAccounts)
    .values({
      customerId: order.customerId,
      email: payload.email,
      password: payload.password,
      orderId: ctx.orderId,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return row;
}

