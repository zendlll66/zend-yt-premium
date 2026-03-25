import { listLineTemplates } from "@/features/support/line-template.repo";
import { TemplateEditor } from "./template-editor";

export const metadata = { title: "ตั้งค่าข้อความ LINE | แดชบอร์ด" };

export default async function LineTemplatesPage() {
  const templates = await listLineTemplates();

  return (
    <div className="flex flex-1 flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold">ตั้งค่าข้อความ LINE</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          กำหนดข้อความที่ส่งไปยังลูกค้าผ่าน LINE ในแต่ละสถานการณ์
          ใช้ตัวแปร <code className="bg-muted px-1 rounded text-xs">{"{{variable}}"}</code> เพื่อแทรกข้อมูลแบบไดนามิก
        </p>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          ยังไม่มีเทมเพลต — รัน migration เพื่อสร้างเทมเพลตเริ่มต้น
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((t) => (
            <TemplateEditor key={t.id} template={t} />
          ))}
        </div>
      )}
    </div>
  );
}
