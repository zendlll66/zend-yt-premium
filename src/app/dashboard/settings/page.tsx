import { getShopSettings } from "@/features/settings/settings.repo";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const initial = await getShopSettings();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">ตั้งค่าร้าน</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          ข้อมูลร้าน และการตั้งค่าที่ใช้ในระบบ (ใบเสร็จ, ภาษี, เวลาเปิด-ปิด ฯลฯ)
        </p>
      </div>

      <SettingsForm initial={initial} />
    </div>
  );
}
