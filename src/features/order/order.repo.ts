import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  orders,
  orderItems,
  orderItemModifiers,
} from "@/db/schema/order.schema";
import type { RentalOrderStatus } from "@/db/schema/order.schema";
import { products } from "@/db/schema/product.schema";
import { generateOrderNumber } from "@/lib/order-number";

export type OrderItemInput = {
  productId: number | null;
  productName: string;
  price: number;
  quantity: number;
  modifiers: { modifierName: string; price: number }[];
};

export type CreateRentalOrderInput = {
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  rentalStart: Date;
  rentalEnd: Date;
  createdBy?: number | null;
  items: OrderItemInput[];
};

export type OrderListItem = {
  id: number;
  orderNumber: string;
  status: string;
  totalPrice: number;
  depositAmount: number;
  rentalStart: Date | null;
  rentalEnd: Date | null;
  customerName: string;
  customerEmail: string;
  createdAt: Date | null;
};

export type OrderItemWithModifiers = {
  id: number;
  productId: number | null;
  productName: string;
  price: number;
  quantity: number;
  totalPrice: number;
  modifiers: { modifierName: string; price: number }[];
};

export type OrderDetail = {
  id: number;
  orderNumber: string;
  status: string;
  totalPrice: number;
  depositAmount: number;
  rentalStart: Date | null;
  rentalEnd: Date | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  stripePaymentIntentId: string | null;
  stripePaymentStatus: string | null;
  createdBy: number | null;
  createdAt: Date | null;
  items: OrderItemWithModifiers[];
};

async function reserveOrderNumber(): Promise<string> {
  const maxAttempts = 5;
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

function getRentalDays(start: Date, end: Date): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export async function createRentalOrder(data: CreateRentalOrderInput): Promise<OrderDetail | null> {
  const orderNum = await reserveOrderNumber();
  const days = getRentalDays(data.rentalStart, data.rentalEnd);

  let orderTotal = 0;
  for (const item of data.items) {
    const modifierTotal = item.modifiers.reduce((s, m) => s + m.price, 0);
    orderTotal += (item.price + modifierTotal) * item.quantity * days;
  }

  const productIds = [...new Set(data.items.map((i) => i.productId).filter((id): id is number => id != null))];
  const productRows =
    productIds.length === 0 ? [] : await db.select({ id: products.id, deposit: products.deposit }).from(products).where(inArray(products.id, productIds));
  const depositByProductId = Object.fromEntries(productRows.map((p) => [p.id, p.deposit ?? 0]));
  const depositAmount = data.items.reduce((sum, item) => {
    const d = item.productId != null ? (depositByProductId[item.productId] ?? 0) : 0;
    return sum + d * item.quantity;
  }, 0);

  const orderId = await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber: orderNum,
        status: "pending",
        totalPrice: orderTotal,
        depositAmount,
        rentalStart: data.rentalStart,
        rentalEnd: data.rentalEnd,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone ?? null,
        createdBy: data.createdBy ?? null,
      })
      .returning({ id: orders.id });
    if (!order) return null;

    for (const item of data.items) {
      const modifierTotal = item.modifiers.reduce((s, m) => s + m.price, 0);
      const lineTotal = (item.price + modifierTotal) * item.quantity * days;
      const [oi] = await tx
        .insert(orderItems)
        .values({
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          quantity: item.quantity,
          totalPrice: lineTotal,
        })
        .returning({ id: orderItems.id });
      if (!oi) continue;
      for (const mod of item.modifiers) {
        await tx.insert(orderItemModifiers).values({
          orderItemId: oi.id,
          modifierName: mod.modifierName,
          price: mod.price,
        });
      }
    }
    return order.id;
  });

  if (orderId == null) return null;
  return findOrderById(orderId);
}

export async function findOrdersByCustomerEmail(
  customerEmail: string,
  limit = 20
): Promise<OrderListItem[]> {
  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      totalPrice: orders.totalPrice,
      depositAmount: orders.depositAmount,
      rentalStart: orders.rentalStart,
      rentalEnd: orders.rentalEnd,
      customerName: orders.customerName,
      customerEmail: orders.customerEmail,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.customerEmail, customerEmail))
    .orderBy(desc(orders.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    orderNumber: r.orderNumber,
    status: r.status,
    totalPrice: r.totalPrice,
    depositAmount: r.depositAmount,
    rentalStart: r.rentalStart,
    rentalEnd: r.rentalEnd,
    customerName: r.customerName,
    customerEmail: r.customerEmail,
    createdAt: r.createdAt,
  }));
}

export async function findOrders(limit = 50): Promise<OrderListItem[]> {
  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      totalPrice: orders.totalPrice,
      depositAmount: orders.depositAmount,
      rentalStart: orders.rentalStart,
      rentalEnd: orders.rentalEnd,
      customerName: orders.customerName,
      customerEmail: orders.customerEmail,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    orderNumber: r.orderNumber,
    status: r.status,
    totalPrice: r.totalPrice,
    depositAmount: r.depositAmount,
    rentalStart: r.rentalStart,
    rentalEnd: r.rentalEnd,
    customerName: r.customerName,
    customerEmail: r.customerEmail,
    createdAt: r.createdAt,
  }));
}

export async function findOrderById(id: number): Promise<OrderDetail | null> {
  const [row] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!row) return null;

  const itemRows = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  const itemIds = itemRows.map((i) => i.id);
  const mods =
    itemIds.length === 0
      ? []
      : await db
          .select()
          .from(orderItemModifiers)
          .where(inArray(orderItemModifiers.orderItemId, itemIds));
  const modsByItem = mods.reduce(
    (acc, m) => {
      if (!acc[m.orderItemId]) acc[m.orderItemId] = [];
      acc[m.orderItemId].push({ modifierName: m.modifierName, price: m.price });
      return acc;
    },
    {} as Record<number, { modifierName: string; price: number }[]>
  );

  return {
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status,
    totalPrice: row.totalPrice,
    depositAmount: row.depositAmount,
    rentalStart: row.rentalStart,
    rentalEnd: row.rentalEnd,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    stripePaymentIntentId: row.stripePaymentIntentId,
    stripePaymentStatus: row.stripePaymentStatus,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    items: itemRows.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      price: i.price,
      quantity: i.quantity,
      totalPrice: i.totalPrice,
      modifiers: modsByItem[i.id] ?? [],
    })),
  };
}

/** ตรวจสอบว่า stock เพียงพอสำหรับรายการที่ต้องการ (ก่อนสร้างคำสั่ง) */
export async function checkStockForItems(
  items: { productId: number | null; quantity: number }[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const byProduct = new Map<number, number>();
  for (const item of items) {
    if (item.productId == null) continue;
    byProduct.set(item.productId, (byProduct.get(item.productId) ?? 0) + item.quantity);
  }
  if (byProduct.size === 0) return { ok: true };
  const productIds = [...byProduct.keys()];
  const rows = await db.select({ id: products.id, name: products.name, stock: products.stock }).from(products).where(inArray(products.id, productIds));
  for (const p of rows) {
    const need = byProduct.get(p.id) ?? 0;
    if (p.stock < need) return { ok: false, error: `สินค้า "${p.name}" เหลือเพียง ${p.stock} ชิ้น (ต้องการ ${need})` };
  }
  return { ok: true };
}

/** ตรวจสอบว่า stock เพียงพอสำหรับคำสั่ง (ไม่หัก) */
export async function validateOrderStock(orderId: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const items = await db
    .select({ productId: orderItems.productId, quantity: orderItems.quantity })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));
  for (const item of items) {
    if (item.productId == null) continue;
    const [p] = await db.select({ stock: products.stock, name: products.name }).from(products).where(eq(products.id, item.productId)).limit(1);
    if (!p) return { ok: false, error: `ไม่พบสินค้าในระบบ` };
    if (p.stock < item.quantity) return { ok: false, error: `สินค้า "${p.name}" เหลือเพียง ${p.stock} ชิ้น (ต้องการ ${item.quantity})` };
  }
  return { ok: true };
}

/** หัก stock ตามรายการในคำสั่ง (ใช้เมื่อสถานะเป็น paid) */
export async function decreaseStockForOrder(orderId: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const items = await db
    .select({ productId: orderItems.productId, quantity: orderItems.quantity })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));
  const productQtys = items.filter((i) => i.productId != null) as { productId: number; quantity: number }[];
  if (productQtys.length === 0) return { ok: true };

  return await db.transaction(async (tx) => {
    for (const { productId, quantity } of productQtys) {
      const [p] = await tx.select({ stock: products.stock, name: products.name }).from(products).where(eq(products.id, productId)).limit(1);
      if (!p) return { ok: false, error: `ไม่พบสินค้าในระบบ` };
      if (p.stock < quantity) return { ok: false, error: `สินค้า "${p.name}" เหลือเพียง ${p.stock} ชิ้น (ต้องการ ${quantity})` };
      await tx.update(products).set({ stock: p.stock - quantity }).where(eq(products.id, productId));
    }
    return { ok: true };
  });
}

/** คืน stock ตามรายการในคำสั่ง (ใช้เมื่อคืนแล้วหรือยกเลิกหลังจากชำระแล้ว) */
export async function increaseStockForOrder(orderId: number): Promise<void> {
  const items = await db
    .select({ productId: orderItems.productId, quantity: orderItems.quantity })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));
  for (const item of items) {
    if (item.productId == null) continue;
    const [p] = await db.select({ stock: products.stock }).from(products).where(eq(products.id, item.productId)).limit(1);
    if (p) await db.update(products).set({ stock: p.stock + item.quantity }).where(eq(products.id, item.productId));
  }
}

export async function updateOrderStatus(id: number, status: RentalOrderStatus) {
  const [current] = await db.select({ status: orders.status }).from(orders).where(eq(orders.id, id)).limit(1);
  if (current && (status === "completed" || (status === "cancelled" && current.status === "paid"))) {
    await increaseStockForOrder(id);
  }
  const [row] = await db
    .update(orders)
    .set({ status })
    .where(eq(orders.id, id))
    .returning();
  return row ?? null;
}

export async function setOrderStripePayment(
  id: number,
  stripePaymentIntentId: string,
  stripePaymentStatus: string
) {
  const stockResult = await decreaseStockForOrder(id);
  if (!stockResult.ok) throw new Error(stockResult.error);
  const [row] = await db
    .update(orders)
    .set({
      stripePaymentIntentId,
      stripePaymentStatus,
      status: "paid",
    })
    .where(eq(orders.id, id))
    .returning();
  return row ?? null;
}

export async function findOrderByStripePaymentIntentId(
  paymentIntentId: string
): Promise<OrderDetail | null> {
  const [row] = await db
    .select()
    .from(orders)
    .where(eq(orders.stripePaymentIntentId, paymentIntentId))
    .limit(1);
  if (!row) return null;
  return findOrderById(row.id);
}

export async function findOrderByOrderNumber(orderNumber: string): Promise<OrderDetail | null> {
  const [row] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);
  if (!row) return null;
  return findOrderById(row.id);
}
