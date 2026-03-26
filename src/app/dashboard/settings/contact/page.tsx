import { listContactSocials } from "@/features/contact/contact-social.repo";
import { ContactSettingsClient } from "./contact-settings-client";

export const metadata = { title: "ตั้งค่าช่องทางติดต่อ" };

export default async function ContactSettingsPage() {
  const socials = await listContactSocials();
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-brand-fg">ช่องทางติดต่อ</h1>
        <p className="text-sm text-brand-fg/50">จัดการช่องทาง social และช่องทางติดต่อที่แสดงในหน้าเว็บ</p>
      </div>
      <ContactSettingsClient socials={socials} />
    </div>
  );
}
