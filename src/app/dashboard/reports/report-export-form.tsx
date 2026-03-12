"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { exportOrdersReportCSV } from "@/features/dashboard/report.actions";
import { Download } from "lucide-react";

const getDefaultFrom = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
};
const getToday = () => new Date().toISOString().slice(0, 10);

export function ReportExportForm() {
  const [from, setFrom] = useState(() => getDefaultFrom());
  const [to, setTo] = useState(() => getToday());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    const fromVal = from.trim();
    const toVal = to.trim();
    if (!fromVal || !toVal) {
      setError("กรุณาเลือกช่วงวันที่");
      return;
    }
    const fromDate = new Date(fromVal);
    const toDate = new Date(toVal);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      setError("รูปแบบวันที่ไม่ถูกต้อง");
      return;
    }
    if (fromDate > toDate) {
      setError("วันเริ่มต้องไม่เกินวันสิ้นสุด");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { csv, filename } = await exportOrdersReportCSV(fromDate, toDate);
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ส่งออกรายงานไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  const today = getToday();

  return (
    <div className="space-y-4 rounded-xl border bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="from">จากวันที่</Label>
          <Input
            id="from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            max={today}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="to">ถึงวันที่</Label>
          <Input
            id="to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            max={today}
            className="mt-1"
          />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={handleExport} disabled={loading}>
        <Download className="mr-2 h-4 w-4" />
        {loading ? "กำลังส่งออก..." : "ส่งออกเป็น CSV"}
      </Button>
    </div>
  );
}
