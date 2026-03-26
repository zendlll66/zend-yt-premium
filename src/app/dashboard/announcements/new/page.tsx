import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { NewAnnouncementForm } from "./new-announcement-form";

export const metadata = { title: "เพิ่มประกาศ" };

export default function NewAnnouncementPage() {
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
        <h1 className="text-xl font-semibold">เพิ่มประกาศใหม่</h1>
      </div>
      <NewAnnouncementForm />
    </div>
  );
}
