import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RoleForm } from "../role-form";

export default function AddRolePage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/roles">← จัดการบทบาท</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold">เพิ่มบทบาท</h1>
      <RoleForm />
    </div>
  );
}
