import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, orderItemModifiers } from "@/db/schema/order.schema";
import { tables } from "@/db/schema/table.schema";
import { generateOrderNumber } from "@/lib/order-number";

export type OrderItemInput = {
  productId: number | null;
  productName: string;
  price: number;
  quantity: number;
  modifiers: { modifierName: string; price: number }[];
};

export type CreateOrderInput = {
  tableId?: number | null;
  createdBy?: number | null;
  items: OrderItemInput[];
};

export type OrderListItem = {
  id: number;
  tableId: number | null;
  tableNumber: string | null;
  orderNumber: string;
  status: string;
  totalPrice: number;
  createdBy: number | null;
  createdAt: Date | null;
};

export type OrderStatus = "pending" | "preparing" | "ready" | "served" | "paid" | "cancelled";

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
  tableId: number | null;
  tableNumber: string | null;
  orderNumber: string;
  status: string;
  totalPrice: number;
  createdBy: number | null;
  createdAt: Date | null;
  items: OrderItemWithModifiers[];
};

/** สร้าง order number ที่ไม่ซ้ำ (ลองใหม่ถ้าซ้ำ) */
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

export async function createOrder(data: CreateOrderInput): Promise<OrderDetail | null> {
  const orderNum = await reserveOrderNumber();

  let orderTotal = 0;
  for (const item of data.items) {
    const modifierTotal = item.modifiers.reduce((s, m) => s + m.price, 0);
    const lineTotal = (item.price + modifierTotal) * item.quantity;
    orderTotal += lineTotal;
  }

  const orderId = await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber: orderNum,
        status: "pending",
        totalPrice: orderTotal,
        tableId: data.tableId ?? null,
        createdBy: data.createdBy ?? null,
      })
      .returning();

    if (!order) return null;

    for (const item of data.items) {
      const modifierTotal = item.modifiers.reduce((s, m) => s + m.price, 0);
      const lineTotal = (item.price + modifierTotal) * item.quantity;

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
        .returning();

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
  const result = await findOrderById(orderId);
  if (result?.tableId) {
    const { updateTable } = await import("@/features/table/table.repo");
    await updateTable(result.tableId, { status: "occupied" });
  }
  return result;
}

export async function findOrders(limit = 50): Promise<OrderListItem[]> {
  const rows = await db
    .select({
      id: orders.id,
      tableId: orders.tableId,
      tableNumber: tables.tableNumber,
      orderNumber: orders.orderNumber,
      status: orders.status,
      totalPrice: orders.totalPrice,
      createdBy: orders.createdBy,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .leftJoin(tables, eq(orders.tableId, tables.id))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
  return rows.map((r) => ({ ...r, tableNumber: r.tableNumber ?? null }));
}

export async function findOrderById(id: number): Promise<OrderDetail | null> {
  const [row] = await db
    .select({
      order: orders,
      tableNumber: tables.tableNumber,
    })
    .from(orders)
    .leftJoin(tables, eq(orders.tableId, tables.id))
    .where(eq(orders.id, id))
    .limit(1);
  if (!row) return null;
  const order = row.order;

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));

  const itemIds = items.map((i) => i.id);
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

  const itemsWithMods: OrderItemWithModifiers[] = items.map((i) => ({
    id: i.id,
    productId: i.productId,
    productName: i.productName,
    price: i.price,
    quantity: i.quantity,
    totalPrice: i.totalPrice,
    modifiers: modsByItem[i.id] ?? [],
  }));

  return {
    id: order.id,
    tableId: order.tableId,
    tableNumber: row.tableNumber ?? null,
    orderNumber: order.orderNumber,
    status: order.status,
    totalPrice: order.totalPrice,
    createdBy: order.createdBy,
    createdAt: order.createdAt,
    items: itemsWithMods,
  };
}

export async function updateOrderStatus(id: number, status: OrderStatus) {
  const [row] = await db
    .update(orders)
    .set({ status })
    .where(eq(orders.id, id))
    .returning();
  if (row && status === "paid" && row.tableId) {
    const activeOrder = await getTableOrder(row.tableId);
    if (!activeOrder) {
      const { updateTable } = await import("@/features/table/table.repo");
      await updateTable(row.tableId, { status: "available" });
    }
  }
  return row ?? null;
}

/** สำหรับ Kitchen Display: บิลที่ status = pending หรือ preparing (และ filter ตาม station ได้) */
export type KitchenOrderItem = {
  id: number;
  productName: string;
  quantity: number;
  modifiers: { modifierName: string; price: number }[];
  kitchenCategoryId: number | null;
};

export type KitchenOrder = {
  id: number;
  orderNumber: string;
  tableNumber: string | null;
  status: string;
  createdAt: Date | null;
  items: KitchenOrderItem[];
};

export async function findOrdersForKitchen(
  kitchenCategoryId?: number | null
): Promise<KitchenOrder[]> {
  const { products } = await import("@/db/schema/product.schema");

  const orderRows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      tableNumber: tables.tableNumber,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .leftJoin(tables, eq(orders.tableId, tables.id))
    .where(inArray(orders.status, ["pending", "preparing"]))
    .orderBy(orders.createdAt);

  const ordersList: KitchenOrder[] = [];

  for (const o of orderRows) {
    const items = await db
      .select({
        id: orderItems.id,
        productId: orderItems.productId,
        productName: orderItems.productName,
        quantity: orderItems.quantity,
        kitchenCategoryId: products.kitchenCategoryId,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, o.id));

    let filteredItems = items;
    if (kitchenCategoryId != null) {
      filteredItems = items.filter(
        (i) => i.kitchenCategoryId === kitchenCategoryId
      );
    }
    if (filteredItems.length === 0) continue;

    const itemIds = filteredItems.map((i) => i.id);
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

    const kitchenItems: KitchenOrderItem[] = filteredItems.map((i) => ({
      id: i.id,
      productName: i.productName,
      quantity: i.quantity,
      modifiers: modsByItem[i.id] ?? [],
      kitchenCategoryId: i.kitchenCategoryId ?? null,
    }));

    ordersList.push({
      id: o.id,
      orderNumber: o.orderNumber,
      tableNumber: o.tableNumber ?? null,
      status: o.status,
      createdAt: o.createdAt,
      items: kitchenItems,
    });
  }

  return ordersList;
}

/** บิลที่ยังไม่เสิร์ฟ/ยังไม่จ่ายของโต๊ะนี้ (สำหรับลูกค้าสั่งเพิ่ม) */
export async function getTableOrder(tableId: number): Promise<OrderDetail | null> {
  const [row] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(
      and(
        eq(orders.tableId, tableId),
        inArray(orders.status, ["pending", "preparing", "ready"])
      )
    )
    .orderBy(desc(orders.createdAt))
    .limit(1);
  if (!row) return null;

  const full = await findOrderById(row.id);
  if (!full) return null;
  if (!["pending", "preparing", "ready"].includes(full.status)) return null;
  return full;
}

/** เพิ่มรายการเข้าไปในบิลที่มีอยู่ (อัปเดต total) */
export async function addItemsToOrder(
  orderId: number,
  newItems: OrderItemInput[]
): Promise<OrderDetail | null> {
  const order = await findOrderById(orderId);
  if (!order) return null;

  let addedTotal = 0;
  for (const item of newItems) {
    const modifierTotal = item.modifiers.reduce((s, m) => s + m.price, 0);
    const lineTotal = (item.price + modifierTotal) * item.quantity;
    addedTotal += lineTotal;
  }

  await db.transaction(async (tx) => {
    for (const item of newItems) {
      const modifierTotal = item.modifiers.reduce((s, m) => s + m.price, 0);
      const lineTotal = (item.price + modifierTotal) * item.quantity;

      const [oi] = await tx
        .insert(orderItems)
        .values({
          orderId,
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          quantity: item.quantity,
          totalPrice: lineTotal,
        })
        .returning();

      if (!oi) continue;
      for (const mod of item.modifiers) {
        await tx.insert(orderItemModifiers).values({
          orderItemId: oi.id,
          modifierName: mod.modifierName,
          price: mod.price,
        });
      }
    }

    await tx
      .update(orders)
      .set({
        totalPrice: order.totalPrice + addedTotal,
      })
      .where(eq(orders.id, orderId));
  });

  const result = await findOrderById(orderId);
  if (result?.tableId) {
    try {
      const { updateTable } = await import("@/features/table/table.repo");
      await updateTable(result.tableId, { status: "occupied" });
    } catch {
      // ไม่ให้การอัปเดตสถานะโต๊ะทำให้การเพิ่มรายการล้มเหลว
    }
  }
  return result;
}
