import "dotenv/config";
import { createOrder, updateOrderStatus } from "@/features/order/order.repo";
import { findAllAdmins } from "@/features/admin/admin.repo";

/** ตัวอย่างบิลแต่ละสถานะ: [สถานะ, รายการสินค้า] */
const SEED_ORDERS: [
  "pending" | "preparing" | "served" | "paid" | "cancelled",
  { productId: number | null; productName: string; price: number; quantity: number; modifiers: { modifierName: string; price: number }[] }[]
][] = [
  [
    "pending",
    [
      { productId: null, productName: "สันในวัว", price: 299, quantity: 1, modifiers: [] },
      {
        productId: null,
        productName: "ผักกาดขาว",
        price: 49,
        quantity: 2,
        modifiers: [{ modifierName: "ระดับความเผ็ด: เผ็ดปานกลาง", price: 0 }],
      },
      { productId: null, productName: "น้ำอัดลม", price: 25, quantity: 2, modifiers: [] },
    ],
  ],
  [
    "preparing",
    [
      {
        productId: null,
        productName: "กุ้งสด",
        price: 189,
        quantity: 1,
        modifiers: [{ modifierName: "ไม่ใส่ผัก", price: 0 }],
      },
      {
        productId: null,
        productName: "บะหมี่ไข่",
        price: 29,
        quantity: 2,
        modifiers: [{ modifierName: "เพิ่มไข่", price: 10 }],
      },
      { productId: null, productName: "ชาเย็น", price: 35, quantity: 1, modifiers: [{ modifierName: "Size: Large", price: 20 }] },
    ],
  ],
  [
    "served",
    [
      { productId: null, productName: "สันในหมู", price: 159, quantity: 2, modifiers: [] },
      { productId: null, productName: "เซ็ตผักรวม", price: 89, quantity: 1, modifiers: [] },
      { productId: null, productName: "น้ำส้ม", price: 45, quantity: 2, modifiers: [{ modifierName: "Size: Medium", price: 10 }] },
      { productId: null, productName: "ข้าวสวย", price: 15, quantity: 2, modifiers: [] },
    ],
  ],
  [
    "paid",
    [
      { productId: null, productName: "เนื้อสไลด์พรีเมียม", price: 349, quantity: 1, modifiers: [] },
      { productId: null, productName: "เห็ดเข็มทอง", price: 59, quantity: 1, modifiers: [] },
      {
        productId: null,
        productName: "โซดา",
        price: 30,
        quantity: 1,
        modifiers: [{ modifierName: "Extra shot: เพิ่ม 1 shot", price: 20 }],
      },
    ],
  ],
  [
    "cancelled",
    [
      { productId: null, productName: "ปลาหมึก", price: 169, quantity: 1, modifiers: [] },
      { productId: null, productName: "น้ำเปล่า", price: 15, quantity: 1, modifiers: [] },
    ],
  ],
];

async function seedOrders() {
  const admins = await findAllAdmins();
  const createdBy = admins[0]?.id ?? null;

  console.log("Seeding orders (one per status)...");

  for (const [status, items] of SEED_ORDERS) {
    const order = await createOrder({ createdBy, items });
    if (!order) {
      console.error("Failed to create order for status:", status);
      continue;
    }

    if (status !== "pending") {
      await updateOrderStatus(order.id, status);
    }

    console.log("  ", order.orderNumber, "→", status, "|", order.totalPrice, "฿");
  }

  console.log("Seed orders done.");
}

seedOrders().catch((e) => {
  console.error("Seed orders failed:", e);
  process.exit(1);
});
