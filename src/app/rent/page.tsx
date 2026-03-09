import { getMenuForOrder } from "@/features/modifier/modifier.repo";
import { getShopSettings } from "@/features/settings/settings.repo";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { findAddressesByCustomerId } from "@/features/customer-address/customer-address.repo";
import { RentClient } from "./rent-client";

export default async function RentPage() {
  const [menu, shop, customer] = await Promise.all([
    getMenuForOrder(),
    getShopSettings(),
    getCustomerSession(),
  ]);
  const addresses = customer
    ? await findAddressesByCustomerId(customer.id)
    : [];

  return (
    <RentClient
      menu={menu}
      shopName={shop.shopName || "ร้านเช่า"}
      shopLogo={shop.shopLogo}
      shopDescription={shop.shopDescription}
      customer={customer ? { name: customer.name, email: customer.email, phone: customer.phone } : null}
      addresses={addresses}
    />
  );
}
