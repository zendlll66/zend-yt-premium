import { db } from "@/db";
import { announcements } from "@/db/schema/announcement.schema";
import { eq, and, or, isNull, lte, gte, asc } from "drizzle-orm";

export type AnnouncementRow = typeof announcements.$inferSelect;

/** ดึงทั้งหมด (admin) */
export async function listAllAnnouncements(): Promise<AnnouncementRow[]> {
  return db
    .select()
    .from(announcements)
    .orderBy(asc(announcements.sortOrder), asc(announcements.createdAt));
}

/** ดึงที่กำลังแสดงอยู่ (public) */
export async function listActiveAnnouncements(): Promise<AnnouncementRow[]> {
  const now = new Date();
  return db
    .select()
    .from(announcements)
    .where(
      and(
        eq(announcements.isEnabled, true),
        or(isNull(announcements.startsAt), lte(announcements.startsAt, now)),
        or(isNull(announcements.endsAt), gte(announcements.endsAt, now))
      )
    )
    .orderBy(asc(announcements.sortOrder), asc(announcements.createdAt));
}

export async function getAnnouncementById(id: number): Promise<AnnouncementRow | null> {
  const [row] = await db
    .select()
    .from(announcements)
    .where(eq(announcements.id, id))
    .limit(1);
  return row ?? null;
}

export async function createAnnouncement(data: {
  title: string;
  content: string;
  isEnabled?: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
  sortOrder?: number;
}): Promise<AnnouncementRow> {
  const [row] = await db.insert(announcements).values(data).returning();
  return row;
}

export async function updateAnnouncement(
  id: number,
  data: Partial<{
    title: string;
    content: string;
    isEnabled: boolean;
    startsAt: Date | null;
    endsAt: Date | null;
    sortOrder: number;
  }>
): Promise<AnnouncementRow> {
  const [row] = await db
    .update(announcements)
    .set(data)
    .where(eq(announcements.id, id))
    .returning();
  return row;
}

export async function deleteAnnouncement(id: number): Promise<void> {
  await db.delete(announcements).where(eq(announcements.id, id));
}
