import { NextResponse } from "next/server";
import { listActiveAnnouncements } from "@/features/announcement/announcement.repo";

export async function GET() {
  const announcements = await listActiveAnnouncements();
  return NextResponse.json(announcements);
}
