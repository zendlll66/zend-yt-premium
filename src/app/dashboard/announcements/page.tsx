import Link from "next/link";
import { listAllAnnouncements } from "@/features/announcement/announcement.repo";
import { ToggleAnnouncementButton } from "./toggle-announcement-button";
import { DeleteAnnouncementButton } from "./delete-announcement-button";
import { Plus, Pencil, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "ประกาศ" };

function getContentPreview(content: string): string {
  try {
    const p = JSON.parse(content);
    if (p && typeof p === "object" && "root" in p) {
      // Extract plain text from Lexical JSON nodes
      function extractText(node: any): string {
        if (node.text) return node.text;
        if (node.children) return node.children.map(extractText).join(" ");
        return "";
      }
      return extractText(p.root).replace(/\s+/g, " ").trim();
    }
  } catch {}
  // Strip HTML tags for legacy content
  return content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit" });
}

export default async function AnnouncementsPage() {
  const announcements = await listAllAnnouncements();

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">ประกาศ</h1>
          <p className="text-sm text-muted-foreground">ข้อความประกาศที่แสดง modal เมื่อเข้าเว็บ</p>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/announcements/new">
            <Plus className="mr-1.5 h-4 w-4" />
            เพิ่มประกาศ
          </Link>
        </Button>
      </div>

      {announcements.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          ยังไม่มีประกาศ กด &ldquo;เพิ่มประกาศ&rdquo; เพื่อสร้างใหม่
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">ชื่อประกาศ</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">ช่วงเวลา</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">ลำดับ</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">สถานะ</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {announcements.map((ann) => (
                <tr key={ann.id} className="transition hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{ann.title}</p>
                    {ann.content && (
                      <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
                        {getContentPreview(ann.content)}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground/60">
                      {new Date(ann.createdAt).toLocaleDateString("th-TH")}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    {ann.startsAt || ann.endsAt ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(ann.startsAt)} — {formatDate(ann.endsAt)}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">ตลอดเวลา</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{ann.sortOrder}</td>
                  <td className="px-4 py-3 text-center">
                    <ToggleAnnouncementButton id={ann.id} isEnabled={ann.isEnabled} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/dashboard/announcements/${ann.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteAnnouncementButton id={ann.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
