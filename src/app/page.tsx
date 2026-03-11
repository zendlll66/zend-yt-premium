import { LandingPage } from "@/components/landing/landing-page";
import { getMenuForOrder } from "@/features/modifier/modifier.repo";
import { findMembershipPlans } from "@/features/membership/membership.repo";
import { getProductsOnSale } from "@/features/promotion/promotion.repo";

export default async function HomePage() {
  const [products, membershipPlans, onSaleProducts] = await Promise.all([
    getMenuForOrder(),
    findMembershipPlans(true),
    getProductsOnSale(),
  ]);
  const productsWithPromo = products.map((p) => {
    const onSale = onSaleProducts.find((s) => s.id === p.id);
    return { ...p, discountPercent: onSale?.discountPercent };
  });
  return (
    <LandingPage
      products={productsWithPromo}
      onSaleProducts={onSaleProducts}
      membershipPlans={membershipPlans.map((p) => ({
        id: p.id,
        name: p.name,
        billingType: p.billingType,
        price: p.price,
        freeRentalDays: p.freeRentalDays,
        discountPercent: p.discountPercent,
        description: p.description,
      }))}
    />
  );
}
