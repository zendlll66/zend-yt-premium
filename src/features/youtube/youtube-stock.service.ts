import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { accountStock } from "@/db/schema/account-stock.schema";
import { customerAccounts } from "@/db/schema/customer-account.schema";
import { customers } from "@/db/schema/customer.schema";
import { familyGroups, familyMembers } from "@/db/schema/family.schema";
import { inviteLinks } from "@/db/schema/invite-link.schema";
import { orderItemModifiers, orderItems, orders, type OrderProductType } from "@/db/schema/order.schema";
import { products } from "@/db/schema/product.schema";
import { addCustomerInventoryItem } from "@/features/inventory/customer-inventory.repo";
import { pushLineTextMessage } from "@/lib/line-message";
import { extractCustomerAccountCredentials } from "@/lib/customer-account-credentials";

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
  const customerId = await resolveCustomerId(conn, ctx);

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
        customerId,
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
  const resolvedCustomerId = await resolveCustomerId(conn, ctx);
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
        customerId: resolvedCustomerId,
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
    const [slot] = await conn
      .select({
        memberId: familyMembers.id,
        familyGroupId: familyMembers.familyGroupId,
        currentOrderId: familyMembers.orderId,
        email: familyMembers.email,
        memberPassword: familyMembers.memberPassword,
        name: familyGroups.name,
      })
      .from(familyMembers)
      .innerJoin(familyGroups, eq(familyMembers.familyGroupId, familyGroups.id))
      .leftJoin(orders, eq(familyMembers.orderId, orders.id))
      .where(
        sql`${familyMembers.orderId} is null or ${orders.status} in ('cancelled', 'refunded')`
      )
      .orderBy(familyMembers.familyGroupId, familyMembers.id)
      .limit(1);

    if (!slot) break;

    const [updated] = await conn
      .update(familyMembers)
      .set({
        customerId: ctx.customerId,
        orderId: ctx.orderId,
      })
      .where(
        and(
          eq(familyMembers.id, slot.memberId),
          slot.currentOrderId == null
            ? sql`${familyMembers.orderId} is null`
            : eq(familyMembers.orderId, slot.currentOrderId)
        )
      )
      .returning({ id: familyMembers.id });

    if (!updated) continue;

    return {
      kind: "family",
      familyGroupId: slot.familyGroupId,
      familyName: slot.name,
      email: slot.email,
      password: slot.memberPassword ?? null,
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

/** ผลรวม quantity ของ order_items ในออเดอร์ (ใช้กำหนดจำนวนรหัส stock ที่จะส่ง) — ถ้าไม่มีหรือเป็น 0 คืน 1 */
export async function getOrderTotalQuantity(conn: typeof db, orderId: number): Promise<number> {
  const rows = await conn
    .select({ quantity: orderItems.quantity })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));
  const total = rows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
  return total < 1 ? 1 : total;
}

async function sendLineInventoryMessage(
  conn: typeof db,
  customerId: number,
  message: string
) {
  const [customer] = await conn
    .select({ lineUserId: customers.lineUserId })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);
  const lineUserId = customer?.lineUserId?.trim();
  if (!lineUserId) {
    console.warn(`[LINE] customer ${customerId} has no lineUserId, skip push`);
    return;
  }
  await pushLineTextMessage(lineUserId, message);
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

async function resolveCustomerAccountCredentialsFromOrder(
  conn: typeof db,
  orderId: number
): Promise<{ email: string | null; password: string | null }> {
  try {
    const itemRows = await conn
      .select({ id: orderItems.id })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
    if (itemRows.length === 0) return { email: null, password: null };
    const modifierRows = await conn
      .select({
        orderItemId: orderItemModifiers.orderItemId,
        modifierName: orderItemModifiers.modifierName,
        price: orderItemModifiers.price,
      })
      .from(orderItemModifiers)
      .where(
        sql`${orderItemModifiers.orderItemId} in (${sql.join(
          itemRows.map((r) => sql`${r.id}`),
          sql`, `
        )})`
      );
    const parsed = extractCustomerAccountCredentials(
      modifierRows.map((m) => ({ modifierName: m.modifierName, price: m.price }))
    );
    return parsed;
  } catch {
    return { email: null, password: null };
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
    await sendLineInventoryMessage(
      conn,
      customerId,
      `ออเดอร์ #${ctx.orderId} ชำระเงินสำเร็จ\nประเภท: Individual\nEmail: ${stock.email}\nPassword: ${stock.password}`
    );
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
    await sendLineInventoryMessage(
      conn,
      customerId,
      `ออเดอร์ #${ctx.orderId} ชำระเงินสำเร็จ\nประเภท: Family (${stock.familyName})\nEmail: ${stock.email}\nPassword: ${stock.password ?? "-"}`
    );
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
    await sendLineInventoryMessage(
      conn,
      customerId,
      `ออเดอร์ #${ctx.orderId} ชำระเงินสำเร็จ\nประเภท: Invite Link\nลิงก์: ${stock.link}`
    );
    return;
  }

  const creds = await resolveCustomerAccountCredentialsFromOrder(conn, ctx.orderId);
  const loginEmail = creds.email ?? ctx.customerEmail;
  const loginPassword = creds.password;

  const [existingCustomerAccount] = await conn
    .select({ id: customerAccounts.id })
    .from(customerAccounts)
    .where(eq(customerAccounts.orderId, ctx.orderId))
    .limit(1);

  if (customerId && loginPassword) {
    if (existingCustomerAccount) {
      await conn
        .update(customerAccounts)
        .set({
          email: loginEmail,
          password: loginPassword,
          status: "pending",
          updatedAt: new Date(),
        })
        .where(eq(customerAccounts.id, existingCustomerAccount.id));
    } else {
      await conn.insert(customerAccounts).values({
        customerId,
        email: loginEmail,
        password: loginPassword,
        orderId: ctx.orderId,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  await addCustomerInventoryItem({
    customerId,
    orderId: ctx.orderId,
    itemType: "customer_account",
    title: "Customer Account",
    loginEmail,
    loginPassword,
    durationDays,
    note: "pending",
    tx: conn,
  });
  await sendLineInventoryMessage(
    conn,
    customerId,
    `ออเดอร์ #${ctx.orderId} ชำระเงินสำเร็จ\nประเภท: Customer Account\nEmail: ${loginEmail}\nPassword: ${loginPassword ?? "-"}`
  );
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
    const totalQty = await getOrderTotalQuantity(conn, input.orderId);
    const stocks: { email: string; password: string }[] = [];
    for (let i = 0; i < totalQty; i++) {
      const s = await claimIndividualStock(conn, ctx);
      if (s.kind === "individual") stocks.push({ email: s.email, password: s.password });
    }
    const customerId = await resolveCustomerId(conn, ctx);
    if (customerId && stocks.length > 0) {
      const durationDays = await resolveOrderDurationDays(conn, ctx.orderId);
      for (let idx = 0; idx < stocks.length; idx++) {
        const stock = stocks[idx];
        await addCustomerInventoryItem({
          customerId,
          orderId: ctx.orderId,
          itemType: "individual",
          title: stocks.length > 1 ? `Individual Account (${idx + 1}/${stocks.length})` : "Individual Account",
          loginEmail: stock.email,
          loginPassword: stock.password,
          durationDays,
          insertOnly: idx > 0,
          tx: conn,
        });
      }
      const lines = stocks.map((s, i) => `รหัส ${i + 1}: ${s.email} / ${s.password}`);
      await sendLineInventoryMessage(
        conn,
        customerId,
        `ออเดอร์ #${ctx.orderId} ชำระเงินสำเร็จ\nประเภท: Individual (${stocks.length} รหัส)\n${lines.join("\n")}`
      );
    }
    assigned = { kind: "individual", email: stocks[0].email, password: stocks[0].password };
    return assigned;
  }

  if (input.productType === "invite") {
    const totalQty = await getOrderTotalQuantity(conn, input.orderId);
    const links: string[] = [];
    for (let i = 0; i < totalQty; i++) {
      const s = await claimInviteLink(conn, ctx);
      if (s.kind === "invite") links.push(s.link);
    }
    const customerId = await resolveCustomerId(conn, ctx);
    if (customerId && links.length > 0) {
      const durationDays = await resolveOrderDurationDays(conn, ctx.orderId);
      for (let idx = 0; idx < links.length; idx++) {
        await addCustomerInventoryItem({
          customerId,
          orderId: ctx.orderId,
          itemType: "invite",
          title: links.length > 1 ? `Invite Link (${idx + 1}/${links.length})` : "Invite Link",
          inviteLink: links[idx],
          durationDays,
          insertOnly: idx > 0,
          tx: conn,
        });
      }
      const lines = links.map((l, i) => `ลิงก์ ${i + 1}: ${l}`);
      await sendLineInventoryMessage(
        conn,
        customerId,
        `ออเดอร์ #${ctx.orderId} ชำระเงินสำเร็จ\nประเภท: Invite Link (${links.length} ลิงก์)\n${lines.join("\n")}`
      );
    }
    if (links.length === 0) throw new Error("OUT_OF_STOCK_INVITE");
    assigned = { kind: "invite", link: links[0] };
    return assigned;
  }

  if (input.productType === "family") {
    assigned = await claimFamilySlot(conn, ctx);
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
    await sendLineInventoryMessage(
      db,
      order.customerId,
      `ออเดอร์ #${ctx.orderId}\nได้รับบัญชีจากลูกค้าแล้ว\nEmail: ${row.email}\nPassword: ${row.password}`
    );
  }
  return row;
}

