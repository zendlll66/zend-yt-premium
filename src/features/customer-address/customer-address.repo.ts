import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { customerAddresses } from "@/db/schema/customer-address.schema";

export type AddressItem = {
  id: number;
  customerId: number;
  label: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  district: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export async function findAddressesByCustomerId(customerId: number): Promise<AddressItem[]> {
  const rows = await db
    .select()
    .from(customerAddresses)
    .where(eq(customerAddresses.customerId, customerId))
    .orderBy(desc(customerAddresses.isDefault), asc(customerAddresses.id));
  return rows.map((r) => ({
    id: r.id,
    customerId: r.customerId,
    label: r.label,
    recipientName: r.recipientName,
    phone: r.phone,
    addressLine1: r.addressLine1,
    addressLine2: r.addressLine2,
    district: r.district,
    province: r.province,
    postalCode: r.postalCode,
    isDefault: r.isDefault,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export async function findAddressByIdAndCustomer(
  id: number,
  customerId: number
): Promise<AddressItem | null> {
  const [row] = await db
    .select()
    .from(customerAddresses)
    .where(eq(customerAddresses.id, id))
    .limit(1);
  if (!row || row.customerId !== customerId) return null;
  return {
    id: row.id,
    customerId: row.customerId,
    label: row.label,
    recipientName: row.recipientName,
    phone: row.phone,
    addressLine1: row.addressLine1,
    addressLine2: row.addressLine2,
    district: row.district,
    province: row.province,
    postalCode: row.postalCode,
    isDefault: row.isDefault,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createAddress(
  customerId: number,
  data: {
    label: string;
    recipientName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string | null;
    district: string;
    province: string;
    postalCode: string;
    isDefault?: boolean;
  }
) {
  if (data.isDefault) {
    await db
      .update(customerAddresses)
      .set({ isDefault: false })
      .where(eq(customerAddresses.customerId, customerId));
  }
  const [row] = await db
    .insert(customerAddresses)
    .values({
      customerId,
      label: data.label,
      recipientName: data.recipientName,
      phone: data.phone,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2 ?? null,
      district: data.district,
      province: data.province,
      postalCode: data.postalCode,
      isDefault: data.isDefault ?? false,
    })
    .returning();
  return row ?? null;
}

export async function updateAddress(
  id: number,
  customerId: number,
  data: {
    label?: string;
    recipientName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string | null;
    district?: string;
    province?: string;
    postalCode?: string;
    isDefault?: boolean;
  }
) {
  const existing = await findAddressByIdAndCustomer(id, customerId);
  if (!existing) return null;
  if (data.isDefault === true) {
    await db
      .update(customerAddresses)
      .set({ isDefault: false })
      .where(eq(customerAddresses.customerId, customerId));
  }
  const payload: Partial<typeof customerAddresses.$inferInsert> = { ...data };
  const [row] = await db
    .update(customerAddresses)
    .set(payload)
    .where(eq(customerAddresses.id, id))
    .returning();
  return row ?? null;
}

export async function deleteAddress(id: number, customerId: number): Promise<boolean> {
  const [row] = await db
    .delete(customerAddresses)
    .where(and(eq(customerAddresses.id, id), eq(customerAddresses.customerId, customerId)))
    .returning({ id: customerAddresses.id });
  return row != null;
}
