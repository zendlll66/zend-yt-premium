import { ReportExportForm } from "./report-export-form";

export const metadata = {
  title: "Export รายงาน | แดชบอร์ด",
  description: "ส่งออกคำสั่งเช่า/รายได้เป็น CSV ตามช่วงวันที่",
};

export default function ReportsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Export รายงาน</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ส่งออกคำสั่งเช่า/รายได้เป็น CSV ตามช่วงวันที่ สำหรับใช้ทำบัญชีหรือส่งสรรพากร
        </p>
      </div>
      <ReportExportForm />
    </div>
  );
}
