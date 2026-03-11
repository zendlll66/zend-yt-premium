"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tv, ExternalLink } from "lucide-react";

const LAYOUTS = [
  { value: "full", label: "เต็มจอ (1 หน้า)" },
  { value: "grid2", label: "ตาราง 2x2 (4 ช่อง)" },
  { value: "split", label: "แบ่งซ้าย-ขวา (2 ช่อง)" },
] as const;

const VIEWS = [
  { value: "orders", label: "คิวบิล / สถิติบิล" },
  { value: "stats", label: "ภาพรวมตัวเลข (รายได้/กำไร)" },
  { value: "revenue", label: "กราฟรายได้รายวัน" },
  { value: "top", label: "สินค้าขายดี" },
  { value: "recent", label: "บิลล่าสุด" },
] as const;

type LayoutValue = (typeof LAYOUTS)[number]["value"];
type ViewValue = (typeof VIEWS)[number]["value"];

const selectClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

export default function MultiDisplayPage() {
  const [layout, setLayout] = useState<LayoutValue>("full");
  const [view, setView] = useState<ViewValue>("orders");
  const [view1, setView1] = useState<ViewValue>("orders");
  const [view2, setView2] = useState<ViewValue>("stats");
  const [view3, setView3] = useState<ViewValue>("revenue");
  const [view4, setView4] = useState<ViewValue>("top");
  const [leftView, setLeftView] = useState<ViewValue>("orders");
  const [rightView, setRightView] = useState<ViewValue>("recent");

  function buildDisplayUrl(): string {
    const base = "/display";
    if (layout === "full") {
      return `${base}?layout=full&view=${view}`;
    }
    if (layout === "split") {
      return `${base}?layout=split&left=${leftView}&right=${rightView}`;
    }
    if (layout === "grid2") {
      return `${base}?layout=grid2&v1=${view1}&v2=${view2}&v3=${view3}&v4=${view4}`;
    }
    return `${base}?layout=full&view=orders`;
  }

  function openDisplay() {
    const url = buildDisplayUrl();
    window.open(url, "display", "width=1920,height=1080,left=0,top=0");
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">จอแสดงผล (Multi-display)</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          เลือก Layout และหน้าที่จะแสดงบนจอที่สอง (เช่น จอทีวีในครัว หรือจอแคชเชียร์) แล้วกดเปิดจอแสดงผล
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <Tv className="h-5 w-5" />
          <h2 className="font-semibold">ตั้งค่าจอแสดงผล</h2>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">
          เลือกรูปแบบการจัดวางและเนื้อหาที่จะแสดงในแต่ละช่อง
        </p>
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Layout (รูปแบบจอ)</label>
              <select
                value={layout}
                onChange={(e) => setLayout(e.target.value as LayoutValue)}
                className={selectClass}
              >
                {LAYOUTS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {layout === "full" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">แสดงหน้า</label>
              <select
                value={view}
                onChange={(e) => setView(e.target.value as ViewValue)}
                className={selectClass}
              >
                {VIEWS.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {layout === "split" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">ช่องซ้าย</label>
                <select
                  value={leftView}
                  onChange={(e) => setLeftView(e.target.value as ViewValue)}
                  className={selectClass}
                >
                  {VIEWS.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">ช่องขวา</label>
                <select
                  value={rightView}
                  onChange={(e) => setRightView(e.target.value as ViewValue)}
                  className={selectClass}
                >
                  {VIEWS.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {layout === "grid2" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "ช่อง 1", value: view1, set: setView1 },
                { label: "ช่อง 2", value: view2, set: setView2 },
                { label: "ช่อง 3", value: view3, set: setView3 },
                { label: "ช่อง 4", value: view4, set: setView4 },
              ].map(({ label, value, set }) => (
                <div key={label} className="space-y-2">
                  <label className="text-sm font-medium">{label}</label>
                  <select
                    value={value}
                    onChange={(e) => set(e.target.value as ViewValue)}
                    className={selectClass}
                  >
                    {VIEWS.map((v) => (
                      <option key={v.value} value={v.value}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-4">
            <Button onClick={openDisplay} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              เปิดจอแสดงผล
            </Button>
            <p className="text-sm text-muted-foreground">
              จะเปิดหน้าต่างใหม่ · ลากไปจอที่สองแล้วกด F11 สำหรับเต็มจอ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
