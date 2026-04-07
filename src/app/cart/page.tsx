import { redirect } from "next/navigation";
import { getMenuForOrder } from "@/features/modifier/modifier.repo";
import { getShopSettings } from "@/features/settings/settings.repo";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { findActiveMembershipByCustomerId } from "@/features/membership/membership.repo";
import { getActivePromotionDiscountMap } from "@/features/promotion/promotion.repo";
import { getCartByCustomerId } from "@/features/cart/cart.repo";
import { CartClient } from "./cart-client";

export default async function CartPage() {
  const [menu, shop, customer, productDiscountMap] = await Promise.all([
    getMenuForOrder(),
    getShopSettings(),
    getCustomerSession(),
    getActivePromotionDiscountMap(),
  ]);

  if (!customer) {
    redirect("/customer-login?from=" + encodeURIComponent("/cart"));
  }

  const [activeMembership, initialCart] = await Promise.all([
    findActiveMembershipByCustomerId(customer.id),
    getCartByCustomerId(customer.id),
  ]);
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
      productDiscountMap={productDiscountMap}
      initialCart={initialCart}
    />
  );
}
