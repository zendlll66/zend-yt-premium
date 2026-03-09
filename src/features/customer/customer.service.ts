import { compare } from "bcryptjs";
import { findCustomerByEmail, findCustomerWithPassword } from "./customer.repo";

export type CustomerSession = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
};

export async function verifyCustomerLogin(
  email: string,
  password: string
): Promise<CustomerSession | null> {
  const user = await findCustomerByEmail(email);
  if (!user) return null;
  const ok = await compare(password, user.password);
  if (!ok) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
  };
}
