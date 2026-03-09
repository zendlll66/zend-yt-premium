import "dotenv/config";
import { createRentalOrder, updateOrderStatus } from "@/features/order/order.repo";

/** คำสั่งเช่าตัวอย่าง 2 รายการ */
async function seedOrders() {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  const end = new Date(start);
  end.setDate(end.getDate() + 3);

  console.log("Seeding sample rental orders...");

  const order1 = await createRentalOrder({
    customerName: "สมชาย ใจดี",
    customerEmail: "somchai@example.com",
    customerPhone: "081-234-5678",
    rentalStart: start,
    rentalEnd: end,
    items: [
      { productId: null, productName: "Canon EOS R5", price: 1500, quantity: 1, modifiers: [] },
      { productId: null, productName: "เลนส์ 24-70mm f/2.8", price: 500, quantity: 1, modifiers: [] },
    ],
  });

  if (order1) {
    await updateOrderStatus(order1.id, "paid");
    console.log("  ", order1.orderNumber, "→ paid |", order1.totalPrice, "฿");
  }

  const order2 = await createRentalOrder({
    customerName: "สมหญิง รักสวย",
    customerEmail: "somying@example.com",
    rentalStart: start,
    rentalEnd: end,
    items: [
      { productId: null, productName: "Toyota Camry", price: 2500, quantity: 1, modifiers: [] },
    ],
  });

  if (order2) {
    console.log("  ", order2.orderNumber, "→ pending |", order2.totalPrice, "฿");
  }

  console.log("Seed orders done.");
}

seedOrders().catch((e) => {
  console.error("Seed orders failed:", e);
  process.exit(1);
});
