import { listEnabledContactSocials } from "@/features/contact/contact-social.repo";
import { ContactPageClient } from "@/components/contact/contact-page-client";

export const metadata = { title: "ติดต่อเรา" };

export default async function ContactPage() {
  const socials = await listEnabledContactSocials();
  return <ContactPageClient socials={socials} />;
}
