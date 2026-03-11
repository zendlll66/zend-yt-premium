import { getMenuForOrder } from "@/features/modifier/modifier.repo";
import { getShopSettings } from "@/features/settings/settings.repo";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { findAddressesByCustomerId } from "@/features/customer-address/customer-address.repo";
import { findActiveMembershipByCustomerId } from "@/features/membership/membership.repo";
import { getActivePromotionDiscountMap } from "@/features/promotion/promotion.repo";
import { getCartByCustomerId } from "@/features/cart/cart.repo";
import { RentClient } from "./rent-client";

export default async function RentPage() {
  const [menu, shop, customer, productDiscountMap] = await Promise.all([
    getMenuForOrder(),
    getShopSettings(),
    getCustomerSession(),
    getActivePromotionDiscountMap(),
  ]);
  const [addresses, activeMembership, initialCart] = await Promise.all([
    customer ? findAddressesByCustomerId(customer.id) : [],
    customer ? findActiveMembershipByCustomerId(customer.id) : null,
    customer ? getCartByCustomerId(customer.id) : [],
  ]);
  const membership =
    activeMembership?.plan != null
      ? {
          freeRentalDays: activeMembership.plan.freeRentalDays,
          discountPercent: activeMembership.plan.discountPercent,
        }
      : null;

  return (
    <RentClient
      menu={menu}
      shopName={shop.shopName || "ร้านเช่า"}
      shopLogo={shop.shopLogo}
      shopDescription={shop.shopDescription}
      deliveryEnabled={shop.deliveryEnabled === "1"}
      customer={customer ? { name: customer.name, email: customer.email, phone: customer.phone } : null}
      addresses={addresses}
      membership={membership}
      productDiscountMap={productDiscountMap}
      initialCart={initialCart}
    />
  );
}
