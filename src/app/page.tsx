import { LandingPage } from "@/components/landing/landing-page";
import { getMenuForOrder } from "@/features/modifier/modifier.repo";
import { findMembershipPlans } from "@/features/membership/membership.repo";

export default async function HomePage() {
  const [products, membershipPlans] = await Promise.all([
    getMenuForOrder(),
    findMembershipPlans(true),
  ]);
  return (
    <LandingPage
      products={products}
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
