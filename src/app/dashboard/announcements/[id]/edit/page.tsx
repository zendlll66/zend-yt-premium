import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getAnnouncementById } from "@/features/announcement/announcement.repo";
import { EditAnnouncementForm } from "./edit-announcement-form";

export const metadata = { title: "แก้ไขประกาศ" };

export default async function EditAnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ann = await getAnnouncementById(parseInt(id, 10));
  if (!ann) notFound();

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/dashboard/announcements"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          กลับ
        </Link>
        <h1 className="text-xl font-semibold">แก้ไขประกาศ</h1>
      </div>
      <EditAnnouncementForm announcement={ann} />
    </div>
  );
}
