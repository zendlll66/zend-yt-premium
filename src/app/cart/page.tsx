import { getMenuForOrder } from "@/features/modifier/modifier.repo";
import { getShopSettings } from "@/features/settings/settings.repo";
import { CartClient } from "./cart-client";

export default async function CartPage() {
  const [menu, shop] = await Promise.all([
    getMenuForOrder(),
    getShopSettings(),
  ]);

  return (
    <CartClient
      menu={menu}
      shopName={shop?.shopName || "ร้านเช่า"}
    />
  );
}
