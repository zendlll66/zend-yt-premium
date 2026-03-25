import { notFound } from "next/navigation";
import { getCouponById } from "@/features/coupon/coupon.repo";
import { CouponForm } from "../../coupon-form";

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coupon = await getCouponById(parseInt(id, 10));
  if (!coupon) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">แก้ไข Coupon</h1>
        <p className="text-sm text-muted-foreground font-mono">{coupon.code}</p>
      </div>
      <CouponForm coupon={coupon} />
    </div>
  );
}
