import "dotenv/config";
import {
  findMembershipPlans,
  upsertMembershipPlan,
} from "@/features/membership/membership.repo";

const DEFAULT_PLANS = [
  {
    name: "สมาชิกรายเดือน",
    billingType: "monthly" as const,
    price: 299,
    freeRentalDays: 1,
    discountPercent: 5,
    description: "ได้วันเช่าฟรี 1 วัน และส่วนลด 5% ทุกครั้งที่เช่า",
    sortOrder: 0,
    isActive: true,
  },
  {
    name: "สมาชิกรายปี",
    billingType: "yearly" as const,
    price: 2990,
    freeRentalDays: 3,
    discountPercent: 10,
    description: "ได้วันเช่าฟรี 3 วัน และส่วนลด 10% ทุกครั้งที่เช่า (ประหยัดกว่าซื้อรายเดือน)",
    sortOrder: 1,
    isActive: true,
  },
];

async function seedMembership() {
  const existingPlans = await findMembershipPlans(false);
  const byName = new Map(existingPlans.map((p) => [p.name, p]));

  for (const plan of DEFAULT_PLANS) {
    const existing = byName.get(plan.name);
    await upsertMembershipPlan({
      id: existing?.id,
      name: plan.name,
      billingType: plan.billingType,
      price: plan.price,
      freeRentalDays: plan.freeRentalDays,
      discountPercent: plan.discountPercent,
      description: plan.description,
      sortOrder: plan.sortOrder,
      isActive: plan.isActive,
    });
    console.log(existing ? "Updated plan:" : "Added plan:", plan.name);
  }
  console.log("Seed membership done.");
}

seedMembership().catch((e) => {
  console.error("Seed membership failed:", e);
  process.exit(1);
});
