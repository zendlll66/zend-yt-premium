"use server";

import { revalidatePath } from "next/cache";
import { getCustomerSession } from "@/lib/auth-customer-server";
import {
  createAddress,
  updateAddress,
  deleteAddress,
  findAddressByIdAndCustomer,
} from "./customer-address.repo";

type AddressInput = {
  label: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  district: string;
  province: string;
  postalCode: string;
  isDefault?: boolean;
};

export async function createAddressAction(formData: FormData): Promise<{ error?: string }> {
  const customer = await getCustomerSession();
  if (!customer) return { error: "กรุณาเข้าสู่ระบบ" };

  const label = (formData.get("label") as string)?.trim() || "ที่อยู่";
  const recipientName = (formData.get("recipientName") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const addressLine1 = (formData.get("addressLine1") as string)?.trim();
  const addressLine2 = (formData.get("addressLine2") as string)?.trim() || null;
  const district = (formData.get("district") as string)?.trim();
  const province = (formData.get("province") as string)?.trim();
  const postalCode = (formData.get("postalCode") as string)?.trim();
  const isDefault = formData.get("isDefault") === "1";

  if (!recipientName || !phone || !addressLine1 || !district || !province || !postalCode) {
    return { error: "กรุณากรอกข้อมูลให้ครบ" };
  }

  await createAddress(customer.id, {
    label,
    recipientName,
    phone,
    addressLine1,
    addressLine2,
    district,
    province,
    postalCode,
    isDefault,
  });
  revalidatePath("/account/addresses");
  revalidatePath("/rent");
  return {};
}

export async function updateAddressAction(
  id: number,
  formData: FormData
): Promise<{ error?: string }> {
  const customer = await getCustomerSession();
  if (!customer) return { error: "กรุณาเข้าสู่ระบบ" };

  const existing = await findAddressByIdAndCustomer(id, customer.id);
  if (!existing) return { error: "ไม่พบที่อยู่" };

  const label = (formData.get("label") as string)?.trim() || existing.label;
  const recipientName = (formData.get("recipientName") as string)?.trim() || existing.recipientName;
  const phone = (formData.get("phone") as string)?.trim() || existing.phone;
  const addressLine1 = (formData.get("addressLine1") as string)?.trim() || existing.addressLine1;
  const addressLine2 = (formData.get("addressLine2") as string)?.trim() || null;
  const district = (formData.get("district") as string)?.trim() || existing.district;
  const province = (formData.get("province") as string)?.trim() || existing.province;
  const postalCode = (formData.get("postalCode") as string)?.trim() || existing.postalCode;
  const isDefault = formData.get("isDefault") === "1";

  await updateAddress(id, customer.id, {
    label,
    recipientName,
    phone,
    addressLine1,
    addressLine2,
    district,
    province,
    postalCode,
    isDefault,
  });
  revalidatePath("/account/addresses");
  revalidatePath("/rent");
  return {};
}

export async function deleteAddressAction(id: number): Promise<{ error?: string }> {
  const customer = await getCustomerSession();
  if (!customer) return { error: "กรุณาเข้าสู่ระบบ" };

  const ok = await deleteAddress(id, customer.id);
  if (!ok) return { error: "ลบไม่สำเร็จหรือไม่พบที่อยู่" };
  revalidatePath("/account/addresses");
  revalidatePath("/rent");
  return {};
}

export async function setDefaultAddressAction(id: number): Promise<{ error?: string }> {
  const customer = await getCustomerSession();
  if (!customer) return { error: "กรุณาเข้าสู่ระบบ" };

  const existing = await findAddressByIdAndCustomer(id, customer.id);
  if (!existing) return { error: "ไม่พบที่อยู่" };

  await updateAddress(id, customer.id, { isDefault: true });
  revalidatePath("/account/addresses");
  revalidatePath("/rent");
  return {};
}
