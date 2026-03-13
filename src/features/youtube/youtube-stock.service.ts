import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { accountStock } from "@/db/schema/account-stock.schema";
import { customerAccounts } from "@/db/schema/customer-account.schema";
import { customers } from "@/db/schema/customer.schema";
import { familyGroups, familyMembers } from "@/db/schema/family.schema";
import { inviteLinks } from "@/db/schema/invite-link.schema";
import { orderItems, orders, type OrderProductType } from "@/db/schema/order.schema";
import { products } from "@/db/schema/product.schema";
import { addCustomerInventoryItem } from "@/features/inventory/customer-inventory.repo";

type AssignContext = {
  orderId: number;
  customerId: number | null;
  customerEmail: string;
};

type AssignedStock =
  | { kind: "individual"; email: string; password: string }
  | { kind: "family"; familyGroupId: number; familyName: string; email: string; password: string | null }
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
        headEmail: familyGroups.headEmail,
        headPassword: familyGroups.headPassword,
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
      email: family.headEmail ?? ctx.customerEmail,
      memberPassword: family.headPassword ?? null,
      orderId: ctx.orderId,
      createdAt: new Date(),
    });

    return {
      kind: "family",
      familyGroupId: family.id,
      familyName: family.name,
      email: family.headEmail ?? ctx.customerEmail,
      password: family.headPassword ?? null,
    };
  }

  throw new Error("NO_FAMILY_SLOT");
}

async function resolveCustomerId(conn: typeof db, ctx: AssignContext): Promise<number | null> {
  if (ctx.customerId) return ctx.customerId;
  const [customer] = await conn
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.email, ctx.customerEmail))
    .limit(1);
  return customer?.id ?? null;
}

async function resolveOrderDurationDays(conn: typeof db, orderId: number): Promise<number> {
  try {
    const [orderItem] = await conn
      .select({ productId: orderItems.productId })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId))
      .limit(1);
    if (!orderItem?.productId) return 30;
    const [product] = await conn
      .select({ durationDays: products.durationDays })
      .from(products)
      .where(eq(products.id, orderItem.productId))
      .limit(1);
    if (!product?.durationDays || product.durationDays < 1) return 30;
    return product.durationDays;
  } catch {
    return 30;
  }
}

async function writeInventoryForAssignedStock(conn: typeof db, ctx: AssignContext, stock: AssignedStock) {
  const customerId = await resolveCustomerId(conn, ctx);
  if (!customerId) return;
  const durationDays = await resolveOrderDurationDays(conn, ctx.orderId);

  if (stock.kind === "individual") {
    await addCustomerInventoryItem({
      customerId,
      orderId: ctx.orderId,
      itemType: "individual",
      title: "Individual Account",
      loginEmail: stock.email,
      loginPassword: stock.password,
      durationDays,
      tx: conn,
    });
    return;
  }

  if (stock.kind === "family") {
    await addCustomerInventoryItem({
      customerId,
      orderId: ctx.orderId,
      itemType: "family",
      title: `Family Group: ${stock.familyName}`,
      loginEmail: stock.email,
      loginPassword: stock.password,
      durationDays,
      note: `family_group_id=${stock.familyGroupId}`,
      tx: conn,
    });
    return;
  }

  if (stock.kind === "invite") {
    await addCustomerInventoryItem({
      customerId,
      orderId: ctx.orderId,
      itemType: "invite",
      title: "Invite Link",
      inviteLink: stock.link,
      durationDays,
      tx: conn,
    });
    return;
  }

  await addCustomerInventoryItem({
    customerId,
    orderId: ctx.orderId,
    itemType: "customer_account",
    title: "Customer Account",
    loginEmail: ctx.customerEmail,
    durationDays,
    note: stock.message,
    tx: conn,
  });
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

  let assigned: AssignedStock;

  if (input.productType === "individual") {
    assigned = await claimIndividualStock(conn, ctx);
  } else if (input.productType === "family") {
    assigned = await claimFamilySlot(conn, ctx);
  } else if (input.productType === "invite") {
    assigned = await claimInviteLink(conn, ctx);
  } else {
    assigned = {
      kind: "customer_account",
      message: "waiting_for_customer_account",
    };
  }

  await writeInventoryForAssignedStock(conn, ctx, assigned);
  return assigned;
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
  if (row) {
    await addCustomerInventoryItem({
      customerId: order.customerId,
      orderId: ctx.orderId,
      itemType: "customer_account",
      title: "Customer Account",
      loginEmail: row.email,
      loginPassword: row.password,
      durationDays: await resolveOrderDurationDays(db, ctx.orderId),
      note: "pending",
    });
  }
  return row;
}

