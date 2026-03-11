import { notFound } from "next/navigation";
import { findMembershipPlanById } from "@/features/membership/membership.repo";
import { PlanForm } from "../../plan-form";

export default async function EditMembershipPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const planId = parseInt(id, 10);
  if (!Number.isFinite(planId)) notFound();
  const plan = await findMembershipPlanById(planId);
  if (!plan) notFound();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="text-xl font-semibold">แก้ไขแผน: {plan.name}</h1>
      <PlanForm plan={plan} />
    </div>
  );
}
