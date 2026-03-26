import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { customerInventories } from "@/db/schema/customer-inventory.schema";
import { customerInventoriesHybrid } from "@/db/schema/customer-inventory-hybrid.schema";
import type { InventoryItemType } from "@/db/schema/customer-inventory.schema";
import { orders } from "@/db/schema/order.schema";
import { customers } from "@/db/schema/customer.schema";
import { findCustomerById } from "@/features/customer/customer.repo";
import { generateOrderNumber } from "@/lib/order-number";
import { expiresAtFromDurationMonths } from "@/lib/calendar-months";
import {
  durationDaysToMonthsApprox,
  getCustomerInventoryDurationSupport,
  monthsToDurationDaysApprox,
} from "@/features/inventory/customer-inventory-duration-support";

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
  durationMonths: number;
  activatedAt: Date | null;
  expiresAt: Date | null;
  note: string | null;
  customerName: string;
  customerEmail: string;
};

export async function findInventoryOrderById(id: number): Promise<InventoryOrderDetail | null> {
  const s = await getCustomerInventoryDurationSupport();
  if (!s.useDurationMonthsColumn && !s.useHybridDurationDays) return null;
  if (s.useDurationMonthsColumn) {
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
        durationMonths: customerInventories.durationMonths,
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
      durationMonths: row.durationMonths,
      activatedAt: row.activatedAt,
      expiresAt: row.expiresAt,
      note: row.note,
      customerName: row.customerName ?? "",
      customerEmail: row.customerEmail ?? "",
    };
  }

  const [row] = await db
    .select({
      id: customerInventoriesHybrid.id,
      customerId: customerInventoriesHybrid.customerId,
      orderId: customerInventoriesHybrid.orderId,
      orderNumber: orders.orderNumber,
      orderStatus: orders.status,
      itemType: customerInventoriesHybrid.itemType,
      title: customerInventoriesHybrid.title,
      loginEmail: customerInventoriesHybrid.loginEmail,
      loginPassword: customerInventoriesHybrid.loginPassword,
      inviteLink: customerInventoriesHybrid.inviteLink,
      durationDays: customerInventoriesHybrid.durationDays,
      activatedAt: customerInventoriesHybrid.activatedAt,
      expiresAt: customerInventoriesHybrid.expiresAt,
      note: customerInventoriesHybrid.note,
      customerName: customers.name,
      customerEmail: customers.email,
    })
    .from(customerInventoriesHybrid)
    .leftJoin(orders, eq(customerInventoriesHybrid.orderId, orders.id))
    .leftJoin(customers, eq(customerInventoriesHybrid.customerId, customers.id))
    .where(eq(customerInventoriesHybrid.id, id))
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
    durationMonths: durationDaysToMonthsApprox(row.durationDays ?? 30),
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
    durationMonths?: number;
    activatedAt?: Date | null;
    expiresAt?: Date | null;
    note?: string | null;
  }
) {
  const s = await getCustomerInventoryDurationSupport();
  if (!s.useDurationMonthsColumn && !s.useHybridDurationDays) return null;

  if (s.useDurationMonthsColumn) {
    const set: {
      itemType?: InventoryItemType;
      title?: string;
      loginEmail?: string | null;
      loginPassword?: string | null;
      inviteLink?: string | null;
      durationMonths?: number;
      activatedAt?: Date | null;
      expiresAt?: Date | null;
      note?: string | null;
    } = {};
    if (data.itemType !== undefined) set.itemType = data.itemType;
    if (data.title !== undefined) set.title = data.title;
    if (data.loginEmail !== undefined) set.loginEmail = data.loginEmail;
    if (data.loginPassword !== undefined) set.loginPassword = data.loginPassword;
    if (data.inviteLink !== undefined) set.inviteLink = data.inviteLink;

    if (data.durationMonths !== undefined) {
      const months = Math.max(1, data.durationMonths);
      set.durationMonths = months;
      const [existing] = await db
        .select({ activatedAt: customerInventories.activatedAt, durationMonths: customerInventories.durationMonths })
        .from(customerInventories)
        .where(eq(customerInventories.id, id))
        .limit(1);
      const raw =
        data.activatedAt !== undefined ? data.activatedAt : existing?.activatedAt ?? new Date();
      const base = raw instanceof Date ? raw : raw != null ? new Date(raw) : new Date();
      set.expiresAt = expiresAtFromDurationMonths(base, months);
    } else if (data.expiresAt !== undefined) {
      set.expiresAt = data.expiresAt;
    }

    if (data.activatedAt !== undefined) {
      set.activatedAt = data.activatedAt;
      if (data.durationMonths === undefined && data.expiresAt === undefined) {
        const [existing] = await db
          .select({ durationMonths: customerInventories.durationMonths })
          .from(customerInventories)
          .where(eq(customerInventories.id, id))
          .limit(1);
        const months = Math.max(1, existing?.durationMonths ?? 1);
        const rawAct = data.activatedAt;
        const act =
          rawAct instanceof Date
            ? rawAct
            : rawAct != null
              ? new Date(rawAct)
              : new Date();
        set.expiresAt = expiresAtFromDurationMonths(act, months);
      }
    }
    if (data.note !== undefined) set.note = data.note;
    if (Object.keys(set).length === 0) return null;
    const [updated] = await db
      .update(customerInventories)
      .set(set)
      .where(eq(customerInventories.id, id))
      .returning();
    return updated ?? null;
  }

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

  if (data.durationMonths !== undefined) {
    const months = Math.max(1, data.durationMonths);
    set.durationDays = monthsToDurationDaysApprox(months);
    const [existing] = await db
      .select({ activatedAt: customerInventoriesHybrid.activatedAt, durationDays: customerInventoriesHybrid.durationDays })
      .from(customerInventoriesHybrid)
      .where(eq(customerInventoriesHybrid.id, id))
      .limit(1);
    const raw =
      data.activatedAt !== undefined ? data.activatedAt : existing?.activatedAt ?? new Date();
    const base = raw instanceof Date ? raw : raw != null ? new Date(raw) : new Date();
    set.expiresAt = expiresAtFromDurationMonths(base, months);
  } else if (data.expiresAt !== undefined) {
    set.expiresAt = data.expiresAt;
  }

  if (data.activatedAt !== undefined) {
    set.activatedAt = data.activatedAt;
    if (data.durationMonths === undefined && data.expiresAt === undefined) {
      const [existing] = await db
        .select({ durationDays: customerInventoriesHybrid.durationDays })
        .from(customerInventoriesHybrid)
        .where(eq(customerInventoriesHybrid.id, id))
        .limit(1);
      const months = durationDaysToMonthsApprox(existing?.durationDays ?? 30);
      const rawAct = data.activatedAt;
      const act =
        rawAct instanceof Date
          ? rawAct
          : rawAct != null
            ? new Date(rawAct)
            : new Date();
      set.expiresAt = expiresAtFromDurationMonths(act, months);
    }
  }
  if (data.note !== undefined) set.note = data.note;
  if (Object.keys(set).length === 0) return null;
  const [updated] = await db
    .update(customerInventoriesHybrid)
    .set(set)
    .where(eq(customerInventoriesHybrid.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteInventoryOrderById(id: number): Promise<boolean> {
  const s = await getCustomerInventoryDurationSupport();
  if (s.useDurationMonthsColumn) {
    const result = await db
      .delete(customerInventories)
      .where(eq(customerInventories.id, id))
      .returning({ id: customerInventories.id });
    return result.length > 0;
  }
  const result = await db
    .delete(customerInventoriesHybrid)
    .where(eq(customerInventoriesHybrid.id, id))
    .returning({ id: customerInventoriesHybrid.id });
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
  durationMonths: number;
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

  const dur = await getCustomerInventoryDurationSupport();
  if (!dur.useDurationMonthsColumn && !dur.useHybridDurationDays) return null;

  const durationMonths = Math.max(1, data.durationMonths);
  const activatedAt = data.activatedAt ?? new Date();
  const expiresAt =
    data.expiresAt ?? expiresAtFromDurationMonths(activatedAt, durationMonths);

  const orderNumber = await reserveOrderNumber();
  const s = dur;

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

    if (s.useDurationMonthsColumn) {
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
          durationMonths,
          activatedAt,
          expiresAt,
          note: data.note ?? null,
        })
        .returning({ id: customerInventories.id });
      if (!inventory) return null;
      return { orderId: order.id, inventoryId: inventory.id, orderNumber };
    }

    const [inventory] = await tx
      .insert(customerInventoriesHybrid)
      .values({
        customerId: data.customerId,
        orderId: order.id,
        itemType: data.itemType,
        title: data.title,
        loginEmail: data.loginEmail ?? null,
        loginPassword: data.loginPassword ?? null,
        inviteLink: data.inviteLink ?? null,
        durationDays: monthsToDurationDaysApprox(durationMonths),
        activatedAt,
        expiresAt,
        note: data.note ?? null,
      })
      .returning({ id: customerInventoriesHybrid.id });
    if (!inventory) return null;
    return { orderId: order.id, inventoryId: inventory.id, orderNumber };
  });

  return result;
}

/** ดึง inventory ทั้งหมดของลูกค้าคนนั้น */
export async function findInventoryByCustomerId(
  customerId: number
): Promise<InventoryOrderDetail[]> {
  const s = await getCustomerInventoryDurationSupport();

  if (s.useDurationMonthsColumn) {
    const rows = await db
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
        durationMonths: customerInventories.durationMonths,
        activatedAt: customerInventories.activatedAt,
        expiresAt: customerInventories.expiresAt,
        note: customerInventories.note,
        customerName: customers.name,
        customerEmail: customers.email,
      })
      .from(customerInventories)
      .leftJoin(orders, eq(customerInventories.orderId, orders.id))
      .leftJoin(customers, eq(customerInventories.customerId, customers.id))
      .where(eq(customerInventories.customerId, customerId))
      .orderBy(desc(customerInventories.id));
    return rows.map((row) => ({
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
      durationMonths: row.durationMonths,
      activatedAt: row.activatedAt,
      expiresAt: row.expiresAt,
      note: row.note,
      customerName: row.customerName ?? "",
      customerEmail: row.customerEmail ?? "",
    }));
  }

  const rows = await db
    .select({
      id: customerInventoriesHybrid.id,
      customerId: customerInventoriesHybrid.customerId,
      orderId: customerInventoriesHybrid.orderId,
      orderNumber: orders.orderNumber,
      orderStatus: orders.status,
      itemType: customerInventoriesHybrid.itemType,
      title: customerInventoriesHybrid.title,
      loginEmail: customerInventoriesHybrid.loginEmail,
      loginPassword: customerInventoriesHybrid.loginPassword,
      inviteLink: customerInventoriesHybrid.inviteLink,
      durationDays: customerInventoriesHybrid.durationDays,
      activatedAt: customerInventoriesHybrid.activatedAt,
      expiresAt: customerInventoriesHybrid.expiresAt,
      note: customerInventoriesHybrid.note,
      customerName: customers.name,
      customerEmail: customers.email,
    })
    .from(customerInventoriesHybrid)
    .leftJoin(orders, eq(customerInventoriesHybrid.orderId, orders.id))
    .leftJoin(customers, eq(customerInventoriesHybrid.customerId, customers.id))
    .where(eq(customerInventoriesHybrid.customerId, customerId))
    .orderBy(desc(customerInventoriesHybrid.id));
  return rows.map((row) => ({
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
    durationMonths: durationDaysToMonthsApprox(row.durationDays ?? 30),
    activatedAt: row.activatedAt,
    expiresAt: row.expiresAt,
    note: row.note,
    customerName: row.customerName ?? "",
    customerEmail: row.customerEmail ?? "",
  }));
}

/** อัปเดต customerId ใน inventory + order เมื่อ stock ถูกย้ายลูกค้า */
export async function updateInventoryOrderCustomer(
  orderId: number,
  customerId: number
): Promise<void> {
  const s = await getCustomerInventoryDurationSupport();

  // อัปเดต order
  await db.update(orders).set({ customerId }).where(eq(orders.id, orderId));

  // อัปเดต inventory
  if (s.useDurationMonthsColumn) {
    await db
      .update(customerInventories)
      .set({ customerId })
      .where(eq(customerInventories.orderId, orderId));
  } else {
    await db
      .update(customerInventoriesHybrid)
      .set({ customerId })
      .where(eq(customerInventoriesHybrid.orderId, orderId));
  }
}
