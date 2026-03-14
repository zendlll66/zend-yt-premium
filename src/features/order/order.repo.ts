import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  orders,
  orderItems,
  orderItemModifiers,
} from "@/db/schema/order.schema";
import type { OrderStatus, DeliveryOption, OrderProductType } from "@/db/schema/order.schema";
import { products } from "@/db/schema/product.schema";
import type { ProductStockType } from "@/db/schema/product.schema";
import { payments } from "@/db/schema/payment.schema";
import { accountStock } from "@/db/schema/account-stock.schema";
import { familyMembers } from "@/db/schema/family.schema";
import { inviteLinks } from "@/db/schema/invite-link.schema";
import { customers } from "@/db/schema/customer.schema";
import { generateOrderNumber } from "@/lib/order-number";
import { findActiveMembershipByEmail } from "@/features/membership/membership.repo";
import { assignStockForPaidOrder } from "@/features/youtube/youtube-stock.service";

export type OrderItemInput = {
  productId: number | null;
  productName: string;
  price: number;
  quantity: number;
  modifiers: { modifierName: string; price: number }[];
  /** วันรับของรายการนี้ (legacy rental) */
  rentalStart?: Date | null;
  /** วันคืนของรายการนี้ (legacy rental) */
  rentalEnd?: Date | null;
  /** รับที่ร้าน หรือ ส่ง (legacy rental) */
  deliveryOption?: DeliveryOption | null;
};

export type CreateRentalOrderInput = {
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  createdBy?: number | null;
  items: OrderItemInput[];
};

export type CreateYoutubeOrderInput = {
  productType: OrderProductType;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerId?: number | null;
  totalPrice: number;
  createdBy?: number | null;
};

export type OrderListItem = {
  id: number;
  orderNumber: string;
  status: string;
  productType: string;
  totalPrice: number;
  depositAmount: number;
  rentalStart: Date | null;
  rentalEnd: Date | null;
  customerName: string;
  customerEmail: string;
  customerIdResolved?: number | null;
  customerLineDisplayName?: string | null;
  customerLinePictureUrl?: string | null;
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
  rentalStart: Date | null;
  rentalEnd: Date | null;
  deliveryOption: string | null;
  fulfillmentStatus: string | null;
  fulfillmentUpdatedAt: Date | null;
};

export type OrderDetail = {
  id: number;
  orderNumber: string;
  status: string;
  productType: string;
  totalPrice: number;
  depositAmount: number;
  rentalStart: Date | null;
  rentalEnd: Date | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  customerIdResolved?: number | null;
  customerLineDisplayName?: string | null;
  customerLinePictureUrl?: string | null;
  stripePaymentIntentId: string | null;
  stripePaymentStatus: string | null;
  paymentSlipImageUrl: string | null;
  createdBy: number | null;
  createdAt: Date | null;
  items: OrderItemWithModifiers[];
};

export type DashboardOrderListItem = OrderListItem & {
  items: Array<{ productName: string; quantity: number }>;
  paymentSlipImageUrl: string | null;
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

type OrderColumnSupport = {
  productType: boolean;
  customerId: boolean;
  updatedAt: boolean;
  paymentSlipImageUrl: boolean;
};

let orderColumnSupportCache: OrderColumnSupport | null = null;

async function getOrderColumnSupport(): Promise<OrderColumnSupport> {
  if (orderColumnSupportCache?.productType) return orderColumnSupportCache;
  try {
    const client = db as unknown as {
      $client?: { execute?: (query: string) => Promise<{ rows?: Array<Record<string, unknown>> }> };
    };
    const result = await client.$client?.execute?.('PRAGMA table_info("orders")');
    const rows = (result?.rows ?? []) as Array<Record<string, unknown>>;
    const names = new Set(rows.map((r) => String(r.name ?? "")));
    const support = {
      productType: names.has("product_type"),
      customerId: names.has("customer_id"),
      updatedAt: names.has("updated_at"),
      paymentSlipImageUrl: names.has("payment_slip_image_url"),
    };
    // Cache only when modern columns exist to avoid stale false after migrations.
    if (support.productType) {
      orderColumnSupportCache = support;
    }
    return support;
  } catch {
    const fallback = {
      productType: false,
      customerId: false,
      updatedAt: false,
      paymentSlipImageUrl: false,
    };
    return fallback;
  }
}

function getRentalDays(start: Date, end: Date): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

function isDate(value: unknown): value is Date {
  return value instanceof Date && Number.isFinite(value.getTime());
}

export async function createRentalOrder(data: CreateRentalOrderInput): Promise<OrderDetail | null> {
  const orderNum = await reserveOrderNumber();
  const columnSupport = await getOrderColumnSupport();
  const membership = await findActiveMembershipByEmail(data.customerEmail);
  const freeRentalDays = membership?.plan.freeRentalDays ?? 0;
  const discountPercent = membership?.plan.discountPercent ?? 0;

  let orderTotal = 0;
  let orderRentalStart: Date | null = null;
  let orderRentalEnd: Date | null = null;
  const productIds = [...new Set(data.items.map((i) => i.productId).filter((id): id is number => id != null))];
  const productRows = await (async () => {
    if (productIds.length === 0) return [] as Array<{ id: number; deposit: number | null; stockType: ProductStockType }>;
    try {
      return await db
        .select({
          id: products.id,
          deposit: products.deposit,
          stockType: products.stockType,
        })
        .from(products)
        .where(inArray(products.id, productIds));
    } catch {
      const legacyRows = await db
        .select({
          id: products.id,
          deposit: products.deposit,
        })
        .from(products)
        .where(inArray(products.id, productIds));
      return legacyRows.map((p) => ({ ...p, stockType: "individual" as ProductStockType }));
    }
  })();

  const productById = new Map(productRows.map((p) => [p.id, p]));
  const productTypeSet = new Set<OrderProductType>();
  for (const item of data.items) {
    if (item.productId == null) continue;
    const product = productById.get(item.productId);
    if (!product) continue;
    productTypeSet.add(product.stockType as OrderProductType);
  }
  if (productTypeSet.size > 1) {
    throw new Error("MIXED_PRODUCT_TYPE_NOT_SUPPORTED");
  }
  const inferredProductType = [...productTypeSet][0] ?? "individual";

  for (const item of data.items) {
    const hasRentalDates = isDate(item.rentalStart) && isDate(item.rentalEnd);
    const days =
      hasRentalDates && item.rentalStart != null && item.rentalEnd != null
        ? getRentalDays(item.rentalStart, item.rentalEnd)
        : 1;
    const chargeableDays = Math.max(0, days - freeRentalDays);
    const modifierTotal = item.modifiers.reduce((s, m) => s + m.price, 0);
    orderTotal += (item.price + modifierTotal) * item.quantity * chargeableDays;
    if (hasRentalDates && item.rentalStart != null && item.rentalEnd != null) {
      const start = new Date(item.rentalStart);
      const end = new Date(item.rentalEnd);
      if (orderRentalStart == null || start < orderRentalStart) orderRentalStart = start;
      if (orderRentalEnd == null || end > orderRentalEnd) orderRentalEnd = end;
    }
  }
  if (discountPercent > 0 && orderTotal > 0) {
    orderTotal = Math.round(orderTotal * (1 - discountPercent / 100) * 100) / 100;
  }
  const fallbackStart =
    data.items[0] && isDate(data.items[0].rentalStart) ? new Date(data.items[0].rentalStart) : new Date();
  const fallbackEnd =
    data.items[0] && isDate(data.items[0].rentalEnd) ? new Date(data.items[0].rentalEnd) : new Date();
  const orderStart = orderRentalStart ?? fallbackStart;
  const orderEnd = orderRentalEnd ?? fallbackEnd;

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
        productType: columnSupport.productType ? inferredProductType : undefined,
        totalPrice: orderTotal,
        depositAmount,
        rentalStart: orderStart,
        rentalEnd: orderEnd,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone ?? null,
        createdBy: data.createdBy ?? null,
      })
      .returning({ id: orders.id });
    if (!order) return null;

    for (const item of data.items) {
      const hasRentalDates = isDate(item.rentalStart) && isDate(item.rentalEnd);
      const days =
        hasRentalDates && item.rentalStart != null && item.rentalEnd != null
          ? getRentalDays(item.rentalStart, item.rentalEnd)
          : 1;
      const chargeableDays = Math.max(0, days - freeRentalDays);
      const modifierTotal = item.modifiers.reduce((s, m) => s + m.price, 0);
      let lineTotal = (item.price + modifierTotal) * item.quantity * chargeableDays;
      if (discountPercent > 0 && lineTotal > 0) {
        lineTotal = Math.round(lineTotal * (1 - discountPercent / 100) * 100) / 100;
      }
      const [oi] = await tx
        .insert(orderItems)
        .values({
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          quantity: item.quantity,
          totalPrice: lineTotal,
          rentalStart: hasRentalDates ? item.rentalStart : null,
          rentalEnd: hasRentalDates ? item.rentalEnd : null,
          deliveryOption: item.deliveryOption ?? null,
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

/** สร้างออเดอร์สำหรับระบบ YouTube Premium ใหม่ (ไม่ใช้ rental items) */
export async function createYoutubeOrder(data: CreateYoutubeOrderInput): Promise<OrderDetail | null> {
  const orderNum = await reserveOrderNumber();
  const columnSupport = await getOrderColumnSupport();
  const [row] = columnSupport.productType
    ? await db
        .insert(orders)
        .values({
          orderNumber: orderNum,
          status: "pending",
          productType: data.productType,
          customerId: columnSupport.customerId ? (data.customerId ?? null) : null,
          totalPrice: data.totalPrice,
          depositAmount: 0,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone ?? null,
          createdBy: data.createdBy ?? null,
          createdAt: new Date(),
          updatedAt: columnSupport.updatedAt ? new Date() : undefined,
        })
        .returning({ id: orders.id })
    : await db
        .insert(orders)
        .values({
          orderNumber: orderNum,
          status: "pending",
          totalPrice: data.totalPrice,
          depositAmount: 0,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone ?? null,
          createdBy: data.createdBy ?? null,
          createdAt: new Date(),
        })
        .returning({ id: orders.id });

  if (!row) return null;
  return findOrderById(row.id);
}

export async function findOrdersByCustomerEmail(
  customerEmail: string,
  limit = 20
): Promise<OrderListItem[]> {
  const columnSupport = await getOrderColumnSupport();
  if (columnSupport.productType) {
    const rows = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        productType: orders.productType,
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
      productType: r.productType,
      totalPrice: r.totalPrice,
      depositAmount: r.depositAmount,
      rentalStart: r.rentalStart,
      rentalEnd: r.rentalEnd,
      customerName: r.customerName,
      customerEmail: r.customerEmail,
      createdAt: r.createdAt,
    }));
  }

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
    productType: "individual",
    totalPrice: r.totalPrice,
    depositAmount: r.depositAmount,
    rentalStart: r.rentalStart,
    rentalEnd: r.rentalEnd,
    customerName: r.customerName,
    customerEmail: r.customerEmail,
    createdAt: r.createdAt,
  }));
}

export type OrderItemForDisplay = {
  id: number;
  productName: string;
  quantity: number;
  fulfillmentStatus: string | null;
  rentalStart: Date | null;
  rentalEnd: Date | null;
};

export type OrderListItemWithItems = OrderListItem & {
  items: OrderItemForDisplay[];
};

export async function findOrdersByCustomerEmailWithItems(
  customerEmail: string,
  limit = 20
): Promise<OrderListItemWithItems[]> {
  const ordersList = await findOrdersByCustomerEmail(customerEmail, limit);
  if (ordersList.length === 0) return [];

  const orderIds = ordersList.map((o) => o.id);
  const itemRows = await db
    .select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      productName: orderItems.productName,
      quantity: orderItems.quantity,
      fulfillmentStatus: orderItems.fulfillmentStatus,
      rentalStart: orderItems.rentalStart,
      rentalEnd: orderItems.rentalEnd,
    })
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderIds));

  const itemsByOrder: Record<number, OrderItemForDisplay[]> = {};
  for (const id of orderIds) itemsByOrder[id] = [];
  for (const row of itemRows) {
    itemsByOrder[row.orderId].push({
      id: row.id,
      productName: row.productName,
      quantity: row.quantity,
      fulfillmentStatus: row.fulfillmentStatus ?? null,
      rentalStart: row.rentalStart ?? null,
      rentalEnd: row.rentalEnd ?? null,
    });
  }

  return ordersList.map((o) => ({
    ...o,
    items: itemsByOrder[o.id] ?? [],
  }));
}

export async function findOrders(limit = 50): Promise<OrderListItem[]> {
  const columnSupport = await getOrderColumnSupport();
  if (columnSupport.productType) {
    const rows = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        productType: orders.productType,
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
      productType: r.productType,
      totalPrice: r.totalPrice,
      depositAmount: r.depositAmount,
      rentalStart: r.rentalStart,
      rentalEnd: r.rentalEnd,
      customerName: r.customerName,
      customerEmail: r.customerEmail,
      createdAt: r.createdAt,
    }));
  }

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
    productType: "individual",
    totalPrice: r.totalPrice,
    depositAmount: r.depositAmount,
    rentalStart: r.rentalStart,
    rentalEnd: r.rentalEnd,
    customerName: r.customerName,
    customerEmail: r.customerEmail,
    createdAt: r.createdAt,
  }));
}

export async function findOrdersForDashboard(limit = 50): Promise<DashboardOrderListItem[]> {
  const columnSupport = await getOrderColumnSupport();
  const rows = columnSupport.productType
    ? await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          productType: orders.productType,
          totalPrice: orders.totalPrice,
          depositAmount: orders.depositAmount,
          rentalStart: orders.rentalStart,
          rentalEnd: orders.rentalEnd,
          customerName: orders.customerName,
          customerEmail: orders.customerEmail,
          customerId: columnSupport.customerId ? orders.customerId : sql<number | null>`null`,
          paymentSlipImageUrl: columnSupport.paymentSlipImageUrl ? orders.paymentSlipImageUrl : sql<string | null>`null`,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
    : await db
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
          customerId: sql<number | null>`null`,
          paymentSlipImageUrl: columnSupport.paymentSlipImageUrl ? orders.paymentSlipImageUrl : sql<string | null>`null`,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(limit);

  if (rows.length === 0) return [];

  const orderIds = rows.map((r) => r.id);
  const itemRows = await db
    .select({
      orderId: orderItems.orderId,
      productName: orderItems.productName,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderIds));

  const itemsByOrder: Record<number, Array<{ productName: string; quantity: number }>> = {};
  for (const id of orderIds) itemsByOrder[id] = [];
  for (const row of itemRows) {
    itemsByOrder[row.orderId].push({
      productName: row.productName,
      quantity: row.quantity,
    });
  }

  const customerIds = [...new Set(rows.map((r) => r.customerId).filter((id): id is number => id != null))];
  const customerEmails = [...new Set(rows.map((r) => r.customerEmail).filter(Boolean))];
  const customersByIdRows =
    customerIds.length > 0
      ? await db
          .select({
            id: customers.id,
            email: customers.email,
            lineDisplayName: customers.lineDisplayName,
            linePictureUrl: customers.linePictureUrl,
          })
          .from(customers)
          .where(inArray(customers.id, customerIds))
      : [];
  const customersByEmailRows =
    customerEmails.length > 0
      ? await db
          .select({
            id: customers.id,
            email: customers.email,
            lineDisplayName: customers.lineDisplayName,
            linePictureUrl: customers.linePictureUrl,
          })
          .from(customers)
          .where(inArray(customers.email, customerEmails))
      : [];
  const customersById = new Map(customersByIdRows.map((c) => [c.id, c]));
  const customersByEmail = new Map(customersByEmailRows.map((c) => [c.email, c]));

  return rows.map((r) => {
    const customer = (r.customerId != null ? customersById.get(r.customerId) : undefined) ?? customersByEmail.get(r.customerEmail);
    return {
      id: r.id,
      orderNumber: r.orderNumber,
      status: r.status,
      productType: columnSupport.productType ? ((r as { productType?: string }).productType ?? "individual") : "individual",
      totalPrice: r.totalPrice,
      depositAmount: r.depositAmount,
      rentalStart: r.rentalStart,
      rentalEnd: r.rentalEnd,
      customerName: r.customerName,
      customerEmail: r.customerEmail,
      customerIdResolved: customer?.id ?? null,
      customerLineDisplayName: customer?.lineDisplayName ?? null,
      customerLinePictureUrl: customer?.linePictureUrl ?? null,
      paymentSlipImageUrl: columnSupport.paymentSlipImageUrl
        ? ((r as { paymentSlipImageUrl?: string | null }).paymentSlipImageUrl ?? null)
        : null,
      createdAt: r.createdAt,
      items: itemsByOrder[r.id] ?? [],
    };
  });
}

/** รายการคำสั่งเช่าตามช่วงวันที่ (สำหรับ Export รายงาน) */
export async function findOrdersByDateRange(
  from: Date,
  to: Date,
  limit = 5000
): Promise<OrderListItem[]> {
  const fromTs = from;
  const toEnd = new Date(to);
  toEnd.setHours(23, 59, 59, 999);
  const columnSupport = await getOrderColumnSupport();
  if (columnSupport.productType) {
    const rows = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        productType: orders.productType,
        totalPrice: orders.totalPrice,
        depositAmount: orders.depositAmount,
        rentalStart: orders.rentalStart,
        rentalEnd: orders.rentalEnd,
        customerName: orders.customerName,
        customerEmail: orders.customerEmail,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, fromTs),
          lte(orders.createdAt, toEnd)
        )
      )
      .orderBy(desc(orders.createdAt))
      .limit(limit);

    return rows.map((r) => ({
      id: r.id,
      orderNumber: r.orderNumber,
      status: r.status,
      productType: r.productType,
      totalPrice: r.totalPrice,
      depositAmount: r.depositAmount,
      rentalStart: r.rentalStart,
      rentalEnd: r.rentalEnd,
      customerName: r.customerName,
      customerEmail: r.customerEmail,
      createdAt: r.createdAt,
    }));
  }

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
    .where(
      and(
        gte(orders.createdAt, fromTs),
        lte(orders.createdAt, toEnd)
      )
    )
    .orderBy(desc(orders.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    orderNumber: r.orderNumber,
    status: r.status,
    productType: "individual",
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
  const columnSupport = await getOrderColumnSupport();
  const [row] = columnSupport.productType
    ? await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          productType: orders.productType,
          totalPrice: orders.totalPrice,
          depositAmount: orders.depositAmount,
          rentalStart: orders.rentalStart,
          rentalEnd: orders.rentalEnd,
          customerName: orders.customerName,
          customerEmail: orders.customerEmail,
          customerPhone: orders.customerPhone,
          customerId: columnSupport.customerId ? orders.customerId : sql<number | null>`null`,
          stripePaymentIntentId: orders.stripePaymentIntentId,
          stripePaymentStatus: orders.stripePaymentStatus,
          paymentSlipImageUrl: columnSupport.paymentSlipImageUrl
            ? orders.paymentSlipImageUrl
            : sql<string | null>`null`,
          createdBy: orders.createdBy,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(eq(orders.id, id))
        .limit(1)
    : await db
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
          customerPhone: orders.customerPhone,
          customerId: sql<number | null>`null`,
          stripePaymentIntentId: orders.stripePaymentIntentId,
          stripePaymentStatus: orders.stripePaymentStatus,
          paymentSlipImageUrl: sql<string | null>`null`,
          createdBy: orders.createdBy,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(eq(orders.id, id))
        .limit(1);
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

  const resolvedCustomer = row.customerId
    ? await db
        .select({
          id: customers.id,
          lineDisplayName: customers.lineDisplayName,
          linePictureUrl: customers.linePictureUrl,
        })
        .from(customers)
        .where(eq(customers.id, row.customerId))
        .limit(1)
        .then((rows) => rows[0] ?? null)
    : await db
        .select({
          id: customers.id,
          lineDisplayName: customers.lineDisplayName,
          linePictureUrl: customers.linePictureUrl,
        })
        .from(customers)
        .where(eq(customers.email, row.customerEmail))
        .limit(1)
        .then((rows) => rows[0] ?? null);

  return {
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status,
    productType: columnSupport.productType ? ((row as { productType?: string }).productType ?? "individual") : "individual",
    totalPrice: row.totalPrice,
    depositAmount: row.depositAmount,
    rentalStart: row.rentalStart,
    rentalEnd: row.rentalEnd,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    customerIdResolved: resolvedCustomer?.id ?? null,
    customerLineDisplayName: resolvedCustomer?.lineDisplayName ?? null,
    customerLinePictureUrl: resolvedCustomer?.linePictureUrl ?? null,
    stripePaymentIntentId: row.stripePaymentIntentId,
    stripePaymentStatus: row.stripePaymentStatus,
    paymentSlipImageUrl: row.paymentSlipImageUrl ?? null,
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
      rentalStart: i.rentalStart ?? null,
      rentalEnd: i.rentalEnd ?? null,
      deliveryOption: i.deliveryOption ?? null,
      fulfillmentStatus: i.fulfillmentStatus ?? null,
      fulfillmentUpdatedAt: i.fulfillmentUpdatedAt ?? null,
    })),
  };
}

/** ตรวจสอบว่า stock เพียงพอสำหรับรายการที่ต้องการ (ก่อนสร้างคำสั่ง) */
async function getAvailableStockByType(stockType: ProductStockType): Promise<number> {
  if (stockType === "individual") {
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(accountStock)
      .where(eq(accountStock.status, "available"));
    return Number(row?.count ?? 0);
  }
  if (stockType === "family") {
    const [row] = await db
      .select({
        count: sql<number>`coalesce(sum(
          case
            when ${familyMembers.orderId} is null then 1
            when ${orders.status} in ('cancelled', 'refunded') then 1
            else 0
          end
        ), 0)`,
      })
      .from(familyMembers)
      .leftJoin(orders, eq(familyMembers.orderId, orders.id));
    return Number(row?.count ?? 0);
  }
  if (stockType === "invite") {
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(inviteLinks)
      .where(eq(inviteLinks.status, "available"));
    return Number(row?.count ?? 0);
  }
  return Number.MAX_SAFE_INTEGER;
}

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
  const rows = await (async () => {
    try {
      return await db
        .select({
          id: products.id,
          name: products.name,
          stockType: products.stockType,
        })
        .from(products)
        .where(inArray(products.id, productIds));
    } catch {
      const legacyRows = await db
        .select({
          id: products.id,
          name: products.name,
        })
        .from(products)
        .where(inArray(products.id, productIds));
      return legacyRows.map((r) => ({ ...r, stockType: "individual" as ProductStockType }));
    }
  })();

  const needByType = new Map<ProductStockType, number>();
  const sampleNameByType = new Map<ProductStockType, string>();
  for (const p of rows) {
    const need = byProduct.get(p.id) ?? 0;
    needByType.set(p.stockType, (needByType.get(p.stockType) ?? 0) + need);
    if (!sampleNameByType.has(p.stockType)) sampleNameByType.set(p.stockType, p.name);
  }

  for (const [stockType, need] of needByType.entries()) {
    const available = await getAvailableStockByType(stockType);
    if (available < need) {
      const sampleName = sampleNameByType.get(stockType) ?? "สินค้า";
      return {
        ok: false,
        error: `สต็อกประเภท ${stockType} ไม่พอ (${sampleName}) เหลือ ${available} รายการ (ต้องการ ${need})`,
      };
    }
  }
  return { ok: true };
}

export async function updateOrderStatus(id: number, status: OrderStatus) {
  const columnSupport = await getOrderColumnSupport();
  return db.transaction(async (tx) => {
    const [current] = columnSupport.productType
      ? await tx
          .select({
            id: orders.id,
            orderNumber: orders.orderNumber,
            status: orders.status,
            productType: orders.productType,
            customerId: columnSupport.customerId ? orders.customerId : sql<number | null>`null`,
            customerEmail: orders.customerEmail,
          })
          .from(orders)
          .where(eq(orders.id, id))
          .limit(1)
      : await tx
          .select({
            id: orders.id,
            orderNumber: orders.orderNumber,
            status: orders.status,
            customerEmail: orders.customerEmail,
          })
          .from(orders)
          .where(eq(orders.id, id))
          .limit(1);
    if (!current) return null;

    const [updated] = await tx
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    if (!updated) return null;

    if (status === "paid" && current.status !== "paid") {
      await assignStockForPaidOrder({
        orderId: id,
        productType: columnSupport.productType
          ? ((current as { productType?: string }).productType as OrderProductType) ?? "individual"
          : "individual",
        customerId: columnSupport.customerId ? ((current as { customerId?: number | null }).customerId ?? null) : null,
        customerEmail: current.customerEmail,
        tx: tx as unknown as typeof db,
      });
    }

    return updated;
  });
}

export async function submitOrderBankSlip(orderId: number, paymentSlipImageUrl: string) {
  const columnSupport = await getOrderColumnSupport();
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    if (!current) return null;
    if (!["pending", "wait"].includes(current.status)) {
      throw new Error("ORDER_BANK_SLIP_INVALID_STATUS");
    }

    const [updated] = columnSupport.paymentSlipImageUrl
      ? await tx
          .update(orders)
          .set({
            status: "wait",
            paymentSlipImageUrl,
            updatedAt: columnSupport.updatedAt ? new Date() : undefined,
          })
          .where(and(eq(orders.id, orderId), inArray(orders.status, ["pending", "wait"])))
          .returning({ id: orders.id, orderNumber: orders.orderNumber, status: orders.status })
      : await tx
          .update(orders)
          .set({
            status: "wait",
            updatedAt: columnSupport.updatedAt ? new Date() : undefined,
          })
          .where(and(eq(orders.id, orderId), inArray(orders.status, ["pending", "wait"])))
          .returning({ id: orders.id, orderNumber: orders.orderNumber, status: orders.status });

    if (!updated) return null;

    await tx
      .update(payments)
      .set({ status: "pending" })
      .where(and(eq(payments.orderId, orderId), eq(payments.provider, "bank_transfer")));

    return updated;
  });
}

export async function setOrderStripePayment(
  id: number,
  stripePaymentIntentId: string,
  stripePaymentStatus: string
) {
  const columnSupport = await getOrderColumnSupport();
  const [order] = columnSupport.productType
    ? await db
        .select({
          id: orders.id,
          status: orders.status,
          productType: orders.productType,
          customerId: columnSupport.customerId ? orders.customerId : sql`null`,
          customerEmail: orders.customerEmail,
          totalPrice: orders.totalPrice,
        })
        .from(orders)
        .where(eq(orders.id, id))
        .limit(1)
    : await db
        .select({
          id: orders.id,
          status: orders.status,
          customerEmail: orders.customerEmail,
          totalPrice: orders.totalPrice,
        })
        .from(orders)
        .where(eq(orders.id, id))
        .limit(1);

  if (!order) return null;
  if (order.status === "paid") return order;
  if (order.status !== "pending") {
    throw new Error("ORDER_NOT_PAYABLE");
  }

  if (!columnSupport.productType) {
    const [row] = await db
      .update(orders)
      .set({
        stripePaymentIntentId,
        stripePaymentStatus,
        status: "paid",
      })
      .where(and(eq(orders.id, id), eq(orders.status, "pending")))
      .returning({ id: orders.id, status: orders.status });
    if (row) return row;
    const [current] = await db
      .select({ id: orders.id, status: orders.status })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);
    return current ?? null;
  }

  return db.transaction(async (tx) => {
    const [updated] = columnSupport.updatedAt
      ? await tx
          .update(orders)
          .set({
            stripePaymentIntentId,
            stripePaymentStatus,
            status: "paid",
            updatedAt: new Date(),
          })
          .where(and(eq(orders.id, id), eq(orders.status, "pending")))
          .returning({
            id: orders.id,
            status: orders.status,
            productType: orders.productType,
            customerId: columnSupport.customerId ? orders.customerId : sql`null`,
            customerEmail: orders.customerEmail,
            totalPrice: orders.totalPrice,
          })
      : await tx
          .update(orders)
          .set({
            stripePaymentIntentId,
            stripePaymentStatus,
            status: "paid",
          })
          .where(and(eq(orders.id, id), eq(orders.status, "pending")))
          .returning({
            id: orders.id,
            status: orders.status,
            productType: orders.productType,
            customerId: columnSupport.customerId ? orders.customerId : sql`null`,
            customerEmail: orders.customerEmail,
            totalPrice: orders.totalPrice,
          });

    if (!updated) {
      const [current] = await tx
        .select({
          id: orders.id,
          status: orders.status,
          productType: orders.productType,
          customerId: columnSupport.customerId ? orders.customerId : sql`null`,
          customerEmail: orders.customerEmail,
          totalPrice: orders.totalPrice,
        })
        .from(orders)
        .where(eq(orders.id, id))
        .limit(1);
      if (current?.status === "paid") return current;
      throw new Error("ORDER_PAYMENT_RACE_CONDITION");
    }

    await tx.insert(payments).values({
      orderId: updated.id,
      provider: "stripe",
      transactionId: stripePaymentIntentId,
      amount: updated.totalPrice,
      currency: "THB",
      status: stripePaymentStatus === "paid" ? "paid" : "pending",
      paidAt: stripePaymentStatus === "paid" ? new Date() : null,
      createdAt: new Date(),
    });

    await assignStockForPaidOrder({
      orderId: updated.id,
      productType: updated.productType,
      customerId: (updated.customerId ?? null) as number | null,
      customerEmail: updated.customerEmail,
      tx: tx as unknown as typeof db,
    });

    return updated;
  });
}

export async function findOrderByStripePaymentIntentId(
  paymentIntentId: string
): Promise<OrderDetail | null> {
  const [row] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.stripePaymentIntentId, paymentIntentId))
    .limit(1);
  if (!row) return null;
  return findOrderById(row.id);
}

export async function findOrderByOrderNumber(orderNumber: string): Promise<OrderDetail | null> {
  const [row] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);
  if (!row) return null;
  return findOrderById(row.id);
}
