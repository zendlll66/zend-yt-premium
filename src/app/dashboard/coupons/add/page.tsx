import { CouponForm } from "../coupon-form";

export default function AddCouponPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">เพิ่ม Coupon</h1>
        <p className="text-sm text-muted-foreground">สร้างรหัสส่วนลดใหม่</p>
      </div>
      <CouponForm />
    </div>
  );
}
