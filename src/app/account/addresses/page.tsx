import Link from "next/link";
import { getCustomerSession } from "@/lib/auth-customer-server";
import { findAddressesByCustomerId } from "@/features/customer-address/customer-address.repo";
import { Button } from "@/components/ui/button";
import { AddressList } from "./address-list";
import { AddAddressForm } from "./add-address-form";

export default async function AddressesPage() {
  const customer = await getCustomerSession();
  if (!customer) return null;

  const addresses = await findAddressesByCustomerId(customer.id);

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/account">← บัญชี</Link>
        </Button>
        <h1 className="mt-2 text-xl font-semibold">ที่อยู่จัดส่ง</h1>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 font-medium">เพิ่มที่อยู่ใหม่</h2>
        <AddAddressForm />
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 font-medium">รายการที่อยู่</h2>
        <AddressList addresses={addresses} />
      </div>
    </div>
  );
}
