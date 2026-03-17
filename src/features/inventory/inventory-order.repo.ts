import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customerInventories } from "@/db/schema/customer-inventory.schema";
import type { InventoryItemType } from "@/db/schema/customer-inventory.schema";
import { orders } from "@/db/schema/order.schema";
import { customers } from "@/db/schema/customer.schema";
import { findCustomerById } from "@/features/customer/customer.repo";
import { generateOrderNumber } from "@/lib/order-number";

export type InventoryOrderDetail = {
  id: number;
  customerId: number;
  orderId: number;
  orderNumber: string;
  orderStatus: string;
  itemType: string;
  title: string;
  loginEmail: string | null;
  loginPassword: string | null;
  inviteLink: string | null;
  durationDays: number;
  activatedAt: Date | null;
  expiresAt: Date | null;
  note: string | null;
  customerName: string;
  customerEmail: string;
};

export async function findInventoryOrderById(id: number): Promise<InventoryOrderDetail | null> {
  const [row] = await db
    .select({
      id: customerInventories.id,
      customerId: customerInventories.customerId,
      orderId: customerInventories.orderId,
      orderNumber: orders.orderNumber,
      orderStatus: orders.status,
      itemType: customerInventories.itemType,
      title: customerInventories.title,
      loginEmail: customerInventories.loginEmail,
      loginPassword: customerInventories.loginPassword,
      inviteLink: customerInventories.inviteLink,
      durationDays: customerInventories.durationDays,
      activatedAt: customerInventories.activatedAt,
      expiresAt: customerInventories.expiresAt,
      note: customerInventories.note,
      customerName: customers.name,
      customerEmail: customers.email,
    })
    .from(customerInventories)
    .leftJoin(orders, eq(customerInventories.orderId, orders.id))
    .leftJoin(customers, eq(customerInventories.customerId, customers.id))
    .where(eq(customerInventories.id, id))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    customerId: row.customerId,
    orderId: row.orderId,
    orderNumber: row.orderNumber ?? "",
    orderStatus: row.orderStatus ?? "paid",
    itemType: row.itemType,
    title: row.title,
    loginEmail: row.loginEmail,
    loginPassword: row.loginPassword,
    inviteLink: row.inviteLink,
    durationDays: row.durationDays,
    activatedAt: row.activatedAt,
    expiresAt: row.expiresAt,
    note: row.note,
    customerName: row.customerName ?? "",
    customerEmail: row.customerEmail ?? "",
  };
}

export async function updateInventoryOrderById(
  id: number,
  data: {
    itemType?: InventoryItemType;
    title?: string;
    loginEmail?: string | null;
    loginPassword?: string | null;
    inviteLink?: string | null;
    durationDays?: number;
    activatedAt?: Date | null;
    expiresAt?: Date | null;
    note?: string | null;
  }
) {
  const set: {
    itemType?: InventoryItemType;
    title?: string;
    loginEmail?: string | null;
    loginPassword?: string | null;
    inviteLink?: string | null;
    durationDays?: number;
    activatedAt?: Date | null;
    expiresAt?: Date | null;
    note?: string | null;
  } = {};
  if (data.itemType !== undefined) set.itemType = data.itemType;
  if (data.title !== undefined) set.title = data.title;
  if (data.loginEmail !== undefined) set.loginEmail = data.loginEmail;
  if (data.loginPassword !== undefined) set.loginPassword = data.loginPassword;
  if (data.inviteLink !== undefined) set.inviteLink = data.inviteLink;
  if (data.durationDays !== undefined) set.durationDays = Math.max(1, data.durationDays);
  if (data.activatedAt !== undefined) set.activatedAt = data.activatedAt;
  if (data.expiresAt !== undefined) set.expiresAt = data.expiresAt;
  if (data.note !== undefined) set.note = data.note;
  if (Object.keys(set).length === 0) return null;
  const [updated] = await db
    .update(customerInventories)
    .set(set)
    .where(eq(customerInventories.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteInventoryOrderById(id: number): Promise<boolean> {
  const result = await db
    .delete(customerInventories)
    .where(eq(customerInventories.id, id))
    .returning({ id: customerInventories.id });
  return result.length > 0;
}

async function reserveOrderNumber(): Promise<string> {
  const maxAttempts = 10;
  for (let i = 0; i < maxAttempts; i++) {
    const num = generateOrderNumber();
    const [existing] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.orderNumber, num))
      .limit(1);
    if (!existing) return num;
  }
  throw new Error("Could not generate unique order number");
}

export type CreateInventoryOrderInput = {
  customerId: number;
  itemType: InventoryItemType;
  title: string;
  loginEmail?: string | null;
  loginPassword?: string | null;
  inviteLink?: string | null;
  durationDays: number;
  activatedAt?: Date | null;
  expiresAt?: Date | null;
  note?: string | null;
};

export type CreateInventoryOrderResult = {
  orderId: number;
  inventoryId: number;
  orderNumber: string;
};

export async function createInventoryOrder(
  data: CreateInventoryOrderInput
): Promise<CreateInventoryOrderResult | null> {
  const customer = await findCustomerById(data.customerId);
  if (!customer) return null;

  const durationDays = Math.max(1, data.durationDays);
  const activatedAt = data.activatedAt ?? new Date();
  const expiresAt =
    data.expiresAt ??
    new Date(activatedAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

  const orderNumber = await reserveOrderNumber();

  const result = await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber,
        status: "paid",
        productType: data.itemType,
        customerId: data.customerId,
        totalPrice: 0,
        depositAmount: 0,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone ?? null,
      })
      .returning({ id: orders.id });
    if (!order) return null;

    const [inventory] = await tx
      .insert(customerInventories)
      .values({
        customerId: data.customerId,
        orderId: order.id,
        itemType: data.itemType,
        title: data.title,
        loginEmail: data.loginEmail ?? null,
        loginPassword: data.loginPassword ?? null,
        inviteLink: data.inviteLink ?? null,
        durationDays,
        activatedAt,
        expiresAt,
        note: data.note ?? null,
      })
      .returning({ id: customerInventories.id });
    if (!inventory) return null;
    return { orderId: order.id, inventoryId: inventory.id, orderNumber };
  });

  return result;
}
