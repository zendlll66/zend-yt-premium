import { findMembershipPlans } from "@/features/membership/membership.repo";
import { PlanForm } from "../plan-form";

export default async function AddMembershipPlanPage() {
  const plans = await findMembershipPlans(false);
  const nextSortOrder = plans.length > 0 ? Math.max(...plans.map((p) => p.sortOrder)) + 1 : 0;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="text-xl font-semibold">เพิ่มแผนสมาชิก</h1>
      <PlanForm defaultSortOrder={nextSortOrder} />
    </div>
  );
}
