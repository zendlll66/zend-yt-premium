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
