"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";

type Props = { defaultFrom?: string; defaultTo?: string };

export function DashboardDateFilter({ defaultFrom, defaultTo }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = new Date().toISOString().slice(0, 10);
  const d = new Date();
  d.setDate(d.getDate() - 30);
  const defaultFromStr = d.toISOString().slice(0, 10);

  const [from, setFrom] = useState(defaultFrom || defaultFromStr);
  const [to, setTo] = useState(defaultTo || today);

  const applyFilter = useCallback(() => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("from", from);
    p.set("to", to);
    router.push(`/dashboard?${p.toString()}`);
  }, [from, to, router, searchParams]);

  const clearFilter = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 px-4 py-3">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <Label htmlFor="dash-from" className="text-xs">จากวันที่</Label>
          <Input
            id="dash-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            max={today}
            className="h-8 w-[140px]"
          />
        </div>
        <div>
          <Label htmlFor="dash-to" className="text-xs">ถึงวันที่</Label>
          <Input
            id="dash-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            max={today}
            className="h-8 w-[140px]"
          />
        </div>
        <Button size="sm" variant="secondary" onClick={applyFilter}>
          กรอง
        </Button>
        {(defaultFrom || defaultTo) && (
          <Button size="sm" variant="ghost" onClick={clearFilter}>
            ล้าง
          </Button>
        )}
      </div>
    </div>
  );
}
