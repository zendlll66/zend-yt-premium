import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema/product.schema";
import { createRentalOrder, updateOrderStatus } from "@/features/order/order.repo";

/** ดึง product id + ราคาจากชื่อ (ต้อง seed-products ก่อน) */
async function getProductByName(name: string): Promise<{ id: number; price: number } | null> {
  const [row] = await db
    .select({ id: products.id, price: products.price })
    .from(products)
    .where(eq(products.name, name))
    .limit(1);
  return row ? { id: row.id, price: row.price } : null;
}

/** สร้างออเดอร์ตัวอย่างจากสินค้าจริงในระบบ (YouTube Premium, Netflix ฯลฯ) */
export async function seedOrders(): Promise<void> {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  const end = new Date(start);
  end.setDate(end.getDate() + 3);

  console.log("Seeding sample orders (products from DB)...");

  const yt1 = await getProductByName("YouTube Premium Individual 1 เดือน");
  const yt3 = await getProductByName("YouTube Premium Individual 3 เดือน");
  const netflix = await getProductByName("Netflix Premium 1 เดือน");
  const disney = await getProductByName("Disney+ Standard 1 เดือน");

  if (yt1 && yt3) {
    const order1 = await createRentalOrder({
      customerName: "สมชาย ใจดี",
      customerEmail: "somchai@example.com",
      customerPhone: "081-234-5678",
      items: [
        { productId: yt1.id, productName: "YouTube Premium Individual 1 เดือน", price: yt1.price, quantity: 1, modifiers: [], rentalStart: start, rentalEnd: end, deliveryOption: "pickup" },
        { productId: yt3.id, productName: "YouTube Premium Individual 3 เดือน", price: yt3.price, quantity: 1, modifiers: [], rentalStart: start, rentalEnd: end, deliveryOption: "pickup" },
      ],
    });
    if (order1) {
      await updateOrderStatus(order1.id, "paid");
      console.log("  ", order1.orderNumber, "→ paid |", order1.totalPrice, "฿");
    }
  } else {
    console.log("  (ข้ามออเดอร์ที่ 1 — ยังไม่มีสินค้า YouTube Premium ใน DB, รัน seed-products ก่อน)");
  }

  if (netflix) {
    const order2 = await createRentalOrder({
      customerName: "สมหญิง รักสวย",
      customerEmail: "somying@example.com",
      customerPhone: "082-345-6789",
      items: [
        { productId: netflix.id, productName: "Netflix Premium 1 เดือน", price: netflix.price, quantity: 1, modifiers: [], rentalStart: start, rentalEnd: end, deliveryOption: "pickup" },
      ],
    });
    if (order2) {
      console.log("  ", order2.orderNumber, "→ pending |", order2.totalPrice, "฿");
    }
  } else {
    console.log("  (ข้ามออเดอร์ที่ 2 — ยังไม่มีสินค้า Netflix ใน DB)");
  }

  if (disney) {
    const order3 = await createRentalOrder({
      customerName: "วิชัย ลูกค้าประจำ",
      customerEmail: "wichai@example.com",
      items: [
        { productId: disney.id, productName: "Disney+ Standard 1 เดือน", price: disney.price, quantity: 2, modifiers: [], rentalStart: start, rentalEnd: end, deliveryOption: "pickup" },
      ],
    });
    if (order3) {
      await updateOrderStatus(order3.id, "paid");
      console.log("  ", order3.orderNumber, "→ paid |", order3.totalPrice, "฿");
    }
  }

  console.log("Seed orders done.");
}

const isMain = process.argv[1]?.replace(/\\/g, "/").endsWith("seed-orders.ts");
if (isMain) {
  seedOrders().catch((e) => {
    console.error("Seed orders failed:", e);
    process.exit(1);
  });
}
