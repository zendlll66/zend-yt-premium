import { db } from "@/db";
import { contactSocials } from "@/db/schema/contact-social.schema";
import { eq, asc } from "drizzle-orm";

export type ContactSocialRow = typeof contactSocials.$inferSelect;

export async function listContactSocials(): Promise<ContactSocialRow[]> {
  return db
    .select()
    .from(contactSocials)
    .orderBy(asc(contactSocials.sortOrder), asc(contactSocials.id));
}

export async function listEnabledContactSocials(): Promise<ContactSocialRow[]> {
  return db
    .select()
    .from(contactSocials)
    .where(eq(contactSocials.isEnabled, true))
    .orderBy(asc(contactSocials.sortOrder), asc(contactSocials.id));
}

export async function createContactSocial(data: {
  label: string;
  platform: string;
  url: string;
  sortOrder?: number;
}) {
  const [row] = await db.insert(contactSocials).values(data).returning();
  return row;
}

export async function updateContactSocial(
  id: number,
  data: { label?: string; platform?: string; url?: string; isEnabled?: boolean; sortOrder?: number }
) {
  const [row] = await db
    .update(contactSocials)
    .set(data)
    .where(eq(contactSocials.id, id))
    .returning();
  return row;
}

export async function deleteContactSocial(id: number) {
  await db.delete(contactSocials).where(eq(contactSocials.id, id));
}
