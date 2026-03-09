import { cookies } from "next/headers";
import { findCustomerById } from "@/features/customer/customer.repo";
import { CUSTOMER_COOKIE_NAME, verifyCustomerSessionCookie } from "./auth-customer";

export type CustomerSessionUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
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
  };
}
