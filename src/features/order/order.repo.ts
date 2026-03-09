import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  orders,
  orderItems,
  orderItemModifiers,
  kitchenOrders,
} from "@/db/schema/order.schema";
import { tables } from "@/db/schema/table.schema";
import { generateOrderNumber } from "@/lib/order-number";

const KITCHEN_STATUS_ORDER: Record<string, number> = {
  pending: 0,
  preparing: 1,
  ready: 2,
  served: 3,
};
const STATUS_BY_LEVEL = ["pending", "preparing", "ready", "served"] as const;

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

export type KitchenOrderGroup = {
  id: number;
  status: string;
  sequence: number;
  createdAt: Date | null;
  items: OrderItemWithModifiers[];
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
  kitchenOrders: KitchenOrderGroup[];
};

/** สร้าง order number ที่ไม่ซ้ำ */
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
    orderTotal += (item.price + modifierTotal) * item.quantity;
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

    const [ko] = await tx
      .insert(kitchenOrders)
      .values({ orderId: order.id, status: "pending", sequence: 1 })
      .returning();
    if (!ko) return null;

    for (const item of data.items) {
      const modifierTotal = item.modifiers.reduce((s, m) => s + m.price, 0);
      const lineTotal = (item.price + modifierTotal) * item.quantity;
      const [oi] = await tx
        .insert(orderItems)
        .values({
          kitchenOrderId: ko.id,
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

  const openBillIds = rows
    .filter((r) => ["pending", "preparing", "ready", "served"].includes(r.status))
    .map((r) => r.id);
  let effectiveStatusByBillId: Record<number, string> = {};
  if (openBillIds.length > 0) {
    const kos = await db
      .select({ orderId: kitchenOrders.orderId, status: kitchenOrders.status })
      .from(kitchenOrders)
      .where(inArray(kitchenOrders.orderId, openBillIds));
    for (const billId of openBillIds) {
      const statuses = kos.filter((k) => k.orderId === billId).map((k) => k.status);
      if (statuses.length === 0) continue;
      const minLevel = Math.min(
        ...statuses.map((s) => KITCHEN_STATUS_ORDER[s] ?? 0)
      );
      effectiveStatusByBillId[billId] = STATUS_BY_LEVEL[minLevel] ?? "pending";
    }
  }

  return rows.map((r) => {
    const effective =
      r.status === "paid" || r.status === "cancelled"
        ? r.status
        : effectiveStatusByBillId[r.id] ?? r.status;
    return {
      ...r,
      tableNumber: r.tableNumber ?? null,
      status: effective,
    };
  });
}

/** ดึงรายการในบิล: จาก kitchen_order_id หรือจาก order_id (legacy) */
async function getItemsForBill(billId: number) {
  const koIds = await db
    .select({ id: kitchenOrders.id })
    .from(kitchenOrders)
    .where(eq(kitchenOrders.orderId, billId));
  const ids = koIds.map((r) => r.id);

  const itemRows =
    ids.length > 0
      ? await db
          .select()
          .from(orderItems)
          .where(
            or(
              eq(orderItems.orderId, billId),
              inArray(orderItems.kitchenOrderId, ids)
            )
          )
      : await db.select().from(orderItems).where(eq(orderItems.orderId, billId));

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

  return itemRows.map((i) => ({
    id: i.id,
    productId: i.productId,
    productName: i.productName,
    price: i.price,
    quantity: i.quantity,
    totalPrice: i.totalPrice,
    modifiers: modsByItem[i.id] ?? [],
  }));
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

  const kos = await db
    .select()
    .from(kitchenOrders)
    .where(eq(kitchenOrders.orderId, id))
    .orderBy(kitchenOrders.sequence, kitchenOrders.createdAt);

  const allItems = await getItemsForBill(id);

  const kitchenOrderGroups: KitchenOrderGroup[] = [];
  for (const ko of kos) {
    const itemRows = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.kitchenOrderId, ko.id));
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
    kitchenOrderGroups.push({
      id: ko.id,
      status: ko.status,
      sequence: ko.sequence,
      createdAt: ko.createdAt,
      items: itemRows.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName,
        price: i.price,
        quantity: i.quantity,
        totalPrice: i.totalPrice,
        modifiers: modsByItem[i.id] ?? [],
      })),
    });
  }

  const legacyItems = await db
    .select()
    .from(orderItems)
    .where(and(eq(orderItems.orderId, id), sql`${orderItems.kitchenOrderId} IS NULL`));
  if (legacyItems.length > 0) {
    const itemIds = legacyItems.map((i) => i.id);
    const mods = await db
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
    kitchenOrderGroups.push({
      id: 0,
      status: order.status,
      sequence: 1,
      createdAt: order.createdAt,
      items: legacyItems.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName,
        price: i.price,
        quantity: i.quantity,
        totalPrice: i.totalPrice,
        modifiers: modsByItem[i.id] ?? [],
      })),
    });
  }

  return {
    id: order.id,
    tableId: order.tableId,
    tableNumber: row.tableNumber ?? null,
    orderNumber: order.orderNumber,
    status: order.status,
    totalPrice: order.totalPrice,
    createdBy: order.createdBy,
    createdAt: order.createdAt,
    items: allItems,
    kitchenOrders: kitchenOrderGroups,
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

/** ซิงค์สถานะบิลจากสถานะของทุกรายการสั่งครัว (ให้รายการบิลแสดงตรงกับ Kitchen) */
async function syncBillStatusFromKitchenOrders(billId: number): Promise<void> {
  const [bill] = await db
    .select({ status: orders.status })
    .from(orders)
    .where(eq(orders.id, billId))
    .limit(1);
  if (!bill || bill.status === "paid" || bill.status === "cancelled") return;

  const kos = await db
    .select({ status: kitchenOrders.status })
    .from(kitchenOrders)
    .where(eq(kitchenOrders.orderId, billId));
  if (kos.length === 0) return;

  const minLevel = Math.min(
    ...kos.map((ko) => KITCHEN_STATUS_ORDER[ko.status] ?? 0)
  );
  const newStatus = STATUS_BY_LEVEL[minLevel] ?? "pending";
  await db.update(orders).set({ status: newStatus }).where(eq(orders.id, billId));
}

/**
 * อัปเดตสถานะรายการสั่งครัว
 * - ถ้า onlyForKitchenCategoryId ไม่ส่ง: เปลี่ยนทั้ง order + ทุกรายการ (ใช้เมื่ออยู่ Station "ทั้งหมด")
 * - ถ้าส่ง onlyForKitchenCategoryId: เปลี่ยนเฉพาะรายการของ station นั้น ไม่แตะ order status และรายการ station อื่น
 */
export async function updateKitchenOrderStatus(
  kitchenOrderId: number,
  status: "pending" | "preparing" | "ready" | "served",
  options?: { onlyForKitchenCategoryId?: number }
) {
  const itemStatus = status === "served" ? "ready" : status;

  if (options?.onlyForKitchenCategoryId != null) {
    const { products } = await import("@/db/schema/product.schema");
    const itemIds = await db
      .select({ id: orderItems.id })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(
        and(
          eq(orderItems.kitchenOrderId, kitchenOrderId),
          eq(products.kitchenCategoryId, options.onlyForKitchenCategoryId)
        )
      );
    const ids = itemIds.map((r) => r.id);
    if (ids.length > 0) {
      await db
        .update(orderItems)
        .set({ status: itemStatus })
        .where(inArray(orderItems.id, ids));
    }
    const [row] = await db
      .select()
      .from(kitchenOrders)
      .where(eq(kitchenOrders.id, kitchenOrderId))
      .limit(1);
    return row ?? null;
  }

  const [row] = await db
    .update(kitchenOrders)
    .set({ status })
    .where(eq(kitchenOrders.id, kitchenOrderId))
    .returning();
  if (!row) return null;
  await db
    .update(orderItems)
    .set({ status: itemStatus })
    .where(eq(orderItems.kitchenOrderId, kitchenOrderId));

  await syncBillStatusFromKitchenOrders(row.orderId);
  return row;
}

/** อัปเดตสถานะต่อรายการ (สำหรับแต่ละ station จัดแยก) */
export async function updateOrderItemStatus(
  orderItemId: number,
  status: "pending" | "preparing" | "ready"
) {
  const [row] = await db
    .update(orderItems)
    .set({ status })
    .where(eq(orderItems.id, orderItemId))
    .returning();
  return row ?? null;
}

export type KitchenOrderItem = {
  id: number;
  productName: string;
  quantity: number;
  modifiers: { modifierName: string; price: number }[];
  kitchenCategoryId: number | null;
  /** สถานะต่อรายการ (แต่ละ station จัดแยกได้) */
  status: string;
};

export type KitchenOrder = {
  id: number;
  orderId: number;
  orderNumber: string;
  tableNumber: string | null;
  status: string;
  sequence: number;
  createdAt: Date | null;
  items: KitchenOrderItem[];
};

export async function findOrdersForKitchen(
  kitchenCategoryId?: number | null
): Promise<KitchenOrder[]> {
  const { products } = await import("@/db/schema/product.schema");

  const koRows = await db
    .select({
      id: kitchenOrders.id,
      orderId: kitchenOrders.orderId,
      status: kitchenOrders.status,
      sequence: kitchenOrders.sequence,
      createdAt: kitchenOrders.createdAt,
      orderNumber: orders.orderNumber,
      tableNumber: tables.tableNumber,
    })
    .from(kitchenOrders)
    .innerJoin(orders, eq(kitchenOrders.orderId, orders.id))
    .leftJoin(tables, eq(orders.tableId, tables.id))
    .where(inArray(kitchenOrders.status, ["pending", "preparing", "ready"]))
    .orderBy(kitchenOrders.createdAt);

  const result: KitchenOrder[] = [];

  for (const ko of koRows) {
    const items = await db
      .select({
        id: orderItems.id,
        productId: orderItems.productId,
        productName: orderItems.productName,
        quantity: orderItems.quantity,
        kitchenCategoryId: products.kitchenCategoryId,
        status: orderItems.status,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.kitchenOrderId, ko.id));

    let filteredItems = items;
    if (kitchenCategoryId != null) {
      filteredItems = items.filter((i) => i.kitchenCategoryId === kitchenCategoryId);
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

    result.push({
      id: ko.id,
      orderId: ko.orderId,
      orderNumber: ko.orderNumber,
      tableNumber: ko.tableNumber ?? null,
      status: ko.status,
      sequence: ko.sequence,
      createdAt: ko.createdAt,
      items: filteredItems.map((i) => ({
        id: i.id,
        productName: i.productName,
        quantity: i.quantity,
        modifiers: modsByItem[i.id] ?? [],
        kitchenCategoryId: i.kitchenCategoryId ?? null,
        status: i.status ?? "pending",
      })),
    });
  }

  return result;
}

/** บิลที่ยังไม่จ่ายของโต๊ะนี้ (สำหรับลูกค้าสั่งเพิ่ม) */
export async function getTableOrder(tableId: number): Promise<OrderDetail | null> {
  const [row] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(
      and(
        eq(orders.tableId, tableId),
        inArray(orders.status, ["pending", "preparing", "ready", "served"])
      )
    )
    .orderBy(desc(orders.createdAt))
    .limit(1);
  if (!row) return null;

  const full = await findOrderById(row.id);
  if (!full) return null;
  if (!["pending", "preparing", "ready", "served"].includes(full.status)) return null;
  return full;
}

/** เพิ่มรายการเข้าไปในบิล = สร้างรายการสั่งครัวใหม่ (order) */
export async function addItemsToOrder(
  orderId: number,
  newItems: OrderItemInput[]
): Promise<OrderDetail | null> {
  const order = await findOrderById(orderId);
  if (!order) return null;

  const nextSeq =
    order.kitchenOrders.length > 0
      ? Math.max(...order.kitchenOrders.map((ko) => ko.sequence)) + 1
      : 1;

  let addedTotal = 0;
  for (const item of newItems) {
    const modifierTotal = item.modifiers.reduce((s, m) => s + m.price, 0);
    addedTotal += (item.price + modifierTotal) * item.quantity;
  }

  await db.transaction(async (tx) => {
    const [ko] = await tx
      .insert(kitchenOrders)
      .values({ orderId, status: "pending", sequence: nextSeq })
      .returning();
    if (!ko) return;

    for (const item of newItems) {
      const modifierTotal = item.modifiers.reduce((s, m) => s + m.price, 0);
      const lineTotal = (item.price + modifierTotal) * item.quantity;
      const [oi] = await tx
        .insert(orderItems)
        .values({
          kitchenOrderId: ko.id,
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
      .set({ totalPrice: order.totalPrice + addedTotal })
      .where(eq(orders.id, orderId));
  });

  const result = await findOrderById(orderId);
  if (result?.tableId) {
    try {
      const { updateTable } = await import("@/features/table/table.repo");
      await updateTable(result.tableId, { status: "occupied" });
    } catch {
      // ignore
    }
  }
  return result;
}
