import { getMenuForOrder } from "@/features/modifier/modifier.repo";
import { getShopSettings } from "@/features/settings/settings.repo";
import { getStockTypeDescriptions } from "@/features/stock-type-descriptions/stock-type-descriptions.repo";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { findActiveMembershipByCustomerId } from "@/features/membership/membership.repo";
import { getActivePromotionDiscountMap } from "@/features/promotion/promotion.repo";
import { getCartByCustomerId } from "@/features/cart/cart.repo";
import { RentClient } from "./rent-client";

export default async function RentPage() {
  const [menu, shop, stockTypeDescriptions, customer, productDiscountMap] = await Promise.all([
    getMenuForOrder(),
    getShopSettings(),
    getStockTypeDescriptions(),
    getCustomerSession(),
    getActivePromotionDiscountMap(),
  ]);
  const [activeMembership, initialCart] = await Promise.all([
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
      shopDescription={shop.shopDescription}
      stockTypeDescriptions={stockTypeDescriptions}
      customer={customer ? { name: customer.name, email: customer.email, phone: customer.phone } : null}
      membership={membership}
      productDiscountMap={productDiscountMap}
      initialCart={initialCart}
      paymentOptions={{
        stripeEnabled: shop.paymentStripeEnabled === "1",
        bankEnabled: shop.paymentBankEnabled === "1",
        bankName: shop.bankName,
        bankAccountName: shop.bankAccountName,
        bankAccountNumber: shop.bankAccountNumber,
      }}
    />
  );
}
