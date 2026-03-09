"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
const LAYOUTS = [
  { id: "1", label: "1 ช่อง", slots: 1, grid: "grid-cols-1" },
  { id: "2h", label: "2 ช่อง (แนวนอน)", slots: 2, grid: "grid-cols-2" },
  { id: "2v", label: "2 ช่อง (แนวตั้ง)", slots: 2, grid: "grid-rows-2 grid-cols-1" },
  { id: "2x2", label: "4 ช่อง (2x2)", slots: 4, grid: "grid-cols-2 grid-rows-2" },
] as const;

function getPathFromSourceId(sourceId: string, _stations: { id: number; name: string }[]): string {
  if (sourceId.startsWith("kitchen-station-")) {
    const id = sourceId.replace("kitchen-station-", "");
    return `/dashboard/kitchen?station=${id}`;
  }
  switch (sourceId) {
    case "dashboard":
      return "/dashboard";
    case "orders":
      return "/dashboard/orders";
    case "kitchen":
      return "/dashboard/kitchen";
    case "tables":
      return "/dashboard/tables";
    default:
      return "/dashboard";
  }
}

type PanelOption = { id: string; label: string };

type Props = {
  initialLayout: string;
  initialPanels: string[];
  kitchenCategories: { id: number; name: string }[];
};

export function MultidisplayView({
  initialLayout,
  initialPanels,
  kitchenCategories,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const layout = LAYOUTS.find((l) => l.id === initialLayout) ?? LAYOUTS[0];
  const slotCount = layout.slots;
  const panels = useMemo(() => {
    const p = [...initialPanels];
    while (p.length < slotCount) p.push("");
    return p.slice(0, slotCount);
  }, [initialPanels, slotCount]);

  const panelOptions: PanelOption[] = useMemo(() => {
    const list: PanelOption[] = [
      { id: "", label: "— ไม่แสดง —" },
      { id: "dashboard", label: "แดชบอร์ด" },
      { id: "orders", label: "รายการบิล" },
      { id: "kitchen", label: "Kitchen (ทั้งหมด)" },
      ...kitchenCategories.map((k) => ({
        id: `kitchen-station-${k.id}`,
        label: `Kitchen - ${k.name}`,
      })),
      { id: "tables", label: "จัดการโต๊ะ" },
    ];
    return list;
  }, [kitchenCategories]);

  const updateUrl = useCallback(
    (newLayout: string, newPanels: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("layout", newLayout);
      params.delete("p1");
      params.delete("p2");
      params.delete("p3");
      params.delete("p4");
      newPanels.forEach((v, i) => {
        if (v) params.set(`p${i + 1}`, v);
      });
      router.push(`/dashboard/multidisplay?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const setLayout = (layoutId: string) => {
    const newLayout = LAYOUTS.find((l) => l.id === layoutId) ?? LAYOUTS[0];
    const currentPanels = panels.slice(0, newLayout.slots);
    while (currentPanels.length < newLayout.slots) currentPanels.push("");
    updateUrl(newLayout.id, currentPanels);
  };

  const setPanel = (index: number, sourceId: string) => {
    const newPanels = [...panels];
    newPanels[index] = sourceId;
    updateUrl(layout.id, newPanels);
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-3">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Layout:</span>
          <select
            value={layout.id}
            onChange={(e) => setLayout(e.target.value)}
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            {LAYOUTS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {panels.map((panelId, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-xs">ช่อง {i + 1}</span>
              <select
                value={panelId}
                onChange={(e) => setPanel(i, e.target.value)}
                className="rounded-md border bg-background px-2 py-1.5 text-sm min-w-[140px]"
              >
                {panelOptions.map((opt) => (
                  <option key={opt.id || "empty"} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className={`grid min-h-0 flex-1 gap-2 overflow-hidden ${layout.grid}`}>
        {panels.map((sourceId, i) => {
          const path = sourceId ? getPathFromSourceId(sourceId, kitchenCategories) : null;
          return (
            <div
              key={i}
              className="min-h-0 overflow-hidden rounded-lg border bg-muted/30"
            >
              {path ? (
                <iframe
                  src={path}
                  title={`Panel ${i + 1}`}
                  className="h-full w-full border-0"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  เลือกหน้าที่แสดง
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
