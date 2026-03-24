export const CART_STORAGE_KEY = "zend-rental-cart";
/** ส่ง event นี้เมื่อตะกร้าเปลี่ยน (ให้ Navbar อัปเดตจำนวน) */
export const CART_UPDATED_EVENT = "zend-cart-update";

export type DeliveryOption = "pickup" | "delivery";

/** ปรับความยาวอาร์เรย์อีเมลให้เท่ากับจำนวนชิ้น (Invite) */
export function resizeInviteEmailsForQty(emails: string[], newQty: number): string[] {
  if (newQty < 1) return [];
  if (emails.length === newQty) return emails;
  if (emails.length > newQty) return emails.slice(0, newQty);
  return [...emails, ...Array(newQty - emails.length).fill("")];
}

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
  /** อีเมลผู้รับลิงก์ต่อชิ้น (สินค้า Invite) — ความยาวควรเท่ากับ quantity */
  inviteRecipientEmails: string[];
  /** ประเภทสต็อกตอนเพิ่มลงตะกร้า (denormalized) */
  productStockType?: string | null;
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

/** คำนวณยอดต่อรายการ: ราคาเดิม, ราคาหลังโปร+สมาชิก, เป็นฟรีหรือไม่ (promotionPercent = ส่วนลดโปรโมชันต่อสินค้า %) */
export function getLineTotalWithMembership(
  item: CartItem,
  membership: MembershipBenefit | null,
  promotionPercent = 0
): { original: number; afterDiscount: number; isFree: boolean } {
  const days = getDaysForItem(item.rentalStart, item.rentalEnd);
  const baseUnit = item.price + item.modifiers.reduce((s, m) => s + m.price, 0);
  const unitPrice = baseUnit * (1 - promotionPercent / 100);
  const original = baseUnit * item.quantity * days;
  const afterPromo = unitPrice * item.quantity * days;
  if (!membership)
    return {
      original,
      afterDiscount: Math.round(afterPromo * 100) / 100,
      isFree: false,
    };
  const chargeableDays = Math.max(0, days - membership.freeRentalDays);
  const afterFree = unitPrice * item.quantity * chargeableDays;
  const afterDiscount =
    Math.round(afterFree * (1 - membership.discountPercent / 100) * 100) / 100;
  return { original, afterDiscount, isFree: afterDiscount === 0 };
}

/** คำนวณยอดรวมตะกร้าพร้อมโปรโมชัน+สิทธิ์สมาชิก (productDiscountMap = productId → ส่วนลด % จากโปร) */
export function getCartTotalWithMembership(
  cart: CartItem[],
  membership: MembershipBenefit | null,
  productDiscountMap: Record<number, number> = {}
): { original: number; afterDiscount: number } {
  let original = 0;
  let afterDiscount = 0;
  for (const item of cart) {
    const promo = productDiscountMap[item.productId ?? 0] ?? 0;
    const line = getLineTotalWithMembership(item, membership, promo);
    original += line.original;
    afterDiscount += line.afterDiscount;
  }
  return { original, afterDiscount };
}
