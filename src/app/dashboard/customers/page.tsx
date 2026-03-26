import { findAllCustomers } from "@/features/customer/customer.repo";
import { CustomersTable } from "./customers-table";

export default async function CustomersPage() {
  const customers = await findAllCustomers();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">รายการลูกค้า</h1>
        <p className="text-sm text-muted-foreground">
          ลูกค้าที่สมัครใช้งานในระบบ ({customers.length} ราย)
        </p>
      </div>
      <CustomersTable customers={customers} />
    </div>
  );
}
