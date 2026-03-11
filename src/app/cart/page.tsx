import { getMenuForOrder } from "@/features/modifier/modifier.repo";
import { getShopSettings } from "@/features/settings/settings.repo";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { findActiveMembershipByCustomerId } from "@/features/membership/membership.repo";
import { CartClient } from "./cart-client";

export default async function CartPage() {
  const [menu, shop, customer] = await Promise.all([
    getMenuForOrder(),
    getShopSettings(),
    getCustomerSession(),
  ]);
  const activeMembership = customer
    ? await findActiveMembershipByCustomerId(customer.id)
    : null;
  const membership =
    activeMembership?.plan != null
      ? {
          freeRentalDays: activeMembership.plan.freeRentalDays,
          discountPercent: activeMembership.plan.discountPercent,
        }
      : null;

  return (
    <CartClient
      menu={menu}
      shopName={shop?.shopName || "ร้านเช่า"}
      membership={membership}
    />
  );
}
