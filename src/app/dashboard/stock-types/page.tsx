import { getStockTypeDescriptionsAction } from "@/features/stock-type-descriptions/stock-type-descriptions.actions";
import { StockTypeForm } from "./stock-type-form";

export default async function StockTypesPage() {
  const items = await getStockTypeDescriptionsAction();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">คำอธิบายประเภท Stock</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          กำหนดชื่อและคำอธิบายของแต่ละประเภท (Individual, Family, Invite, Customer Account) เพื่อแสดงให้ลูกค้าเข้าใจว่าแต่ละแบบคืออะไร ใช้ยังไง
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        {items.map((item) => (
          <StockTypeForm key={item.slug} item={item} />
        ))}
      </div>
    </div>
  );
}
