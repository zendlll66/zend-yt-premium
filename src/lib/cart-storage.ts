export const CART_STORAGE_KEY = "zend-rental-cart";

export type DeliveryOption = "pickup" | "delivery";

export type CartItem = {
  productId: number | null;
  productName: string;
  price: number;
  quantity: number;
  modifiers: { modifierName: string; price: number }[];
  /** วันรับ (YYYY-MM-DD) */
  rentalStart: string;
  /** วันคืน (YYYY-MM-DD) */
  rentalEnd: string;
  deliveryOption: DeliveryOption;
};

export function getDaysForItem(start: string, end: string): number {
  if (!start || !end) return 1;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

/** สิทธิ์สมาชิกที่ใช้คำนวณราคา (วันเช่าฟรี + ส่วนลด %) */
export type MembershipBenefit = {
  freeRentalDays: number;
  discountPercent: number;
};

/** คำนวณยอดต่อรายการพร้อมสิทธิ์สมาชิก: ราคาเดิม, ราคาหลังหักวันฟรี+ส่วนลด, เป็นฟรีหรือไม่ */
export function getLineTotalWithMembership(
  item: CartItem,
  membership: MembershipBenefit | null
): { original: number; afterDiscount: number; isFree: boolean } {
  const days = getDaysForItem(item.rentalStart, item.rentalEnd);
  const unitPrice = item.price + item.modifiers.reduce((s, m) => s + m.price, 0);
  const original = unitPrice * item.quantity * days;
  if (!membership) return { original, afterDiscount: original, isFree: false };
  const chargeableDays = Math.max(0, days - membership.freeRentalDays);
  const afterFree = unitPrice * item.quantity * chargeableDays;
  const afterDiscount =
    Math.round(afterFree * (1 - membership.discountPercent / 100) * 100) / 100;
  return { original, afterDiscount, isFree: afterDiscount === 0 };
}

/** คำนวณยอดรวมตะกร้าพร้อมสิทธิ์สมาชิก */
export function getCartTotalWithMembership(
  cart: CartItem[],
  membership: MembershipBenefit | null
): { original: number; afterDiscount: number } {
  let original = 0;
  let afterDiscount = 0;
  for (const item of cart) {
    const line = getLineTotalWithMembership(item, membership);
    original += line.original;
    afterDiscount += line.afterDiscount;
  }
  return { original, afterDiscount };
}
