import { cookies } from "next/headers";
import { findCustomerById } from "@/features/customer/customer.repo";
import { CUSTOMER_COOKIE_NAME, verifyCustomerSessionCookie } from "./auth-customer";

export type CustomerSessionUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  /** true ถ้าเข้าสู่ระบบด้วย LINE (อีเมลอาจเป็น placeholder) */
  isLineUser: boolean;
  /** ชื่อจาก LINE (ถ้าเป็น LINE user) */
  lineDisplayName: string | null;
  /** URL รูปโปรไฟล์จาก LINE */
  linePictureUrl: string | null;
};

export async function getCustomerSession(): Promise<CustomerSessionUser | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;
  if (!value) return null;
  const customerId = verifyCustomerSessionCookie(value);
  if (!customerId) return null;
  const customer = await findCustomerById(customerId);
  if (!customer) return null;
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    isLineUser: !!customer.lineUserId,
    lineDisplayName: customer.lineDisplayName ?? null,
    linePictureUrl: customer.linePictureUrl ?? null,
  };
}
