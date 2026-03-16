"use client";

import { useState, useMemo } from "react";
import type { CustomerProfile } from "@/features/customer/customer.repo";
import { Input } from "@/components/ui/input";

type Props = {
  customers: CustomerProfile[];
  initialCustomerId: number | null;
};

export function CustomerSelectField({ customers, initialCustomerId }: Props) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(initialCustomerId);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers.slice(0, 100);
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.lineDisplayName ?? "").toLowerCase().includes(q)
    );
  }, [customers, search]);

  const selected = useMemo(
    () => (selectedId ? customers.find((c) => c.id === selectedId) : null),
    [customers, selectedId]
  );

  return (
    <div>
      <label htmlFor="customer-search" className="mb-1.5 block text-sm font-medium">
        ลูกค้า (Customer)
      </label>
      <input type="hidden" name="customerId" value={selectedId ?? ""} />
      <Input
        id="customer-search"
        type="search"
        placeholder="ค้นหาชื่อ, อีเมล, LINE..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-2 w-full"
      />
      <div className="max-h-48 overflow-y-auto rounded-lg border bg-muted/30">
        {filtered.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">ไม่พบลูกค้า</p>
        ) : (
          <ul className="divide-y">
            <li>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted/50 ${
                  selectedId === null ? "bg-primary/10" : ""
                }`}
              >
                <span className="text-muted-foreground">— ไม่ผูกลูกค้า</span>
              </button>
            </li>
            {filtered.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted/50 ${
                    selectedId === c.id ? "bg-primary/10" : ""
                  }`}
                >
                  {c.linePictureUrl ? (
                    <img
                      src={
                        c.linePictureUrl.startsWith("http")
                          ? c.linePictureUrl
                          : `/api/r2-url?key=${encodeURIComponent(c.linePictureUrl)}`
                      }
                      alt=""
                      className="h-8 w-8 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs">
                      {c.name.charAt(0) || "?"}
                    </span>
                  )}
                  <div className="min-w-0 flex-1 truncate">
                    <p className="font-medium truncate">{c.lineDisplayName ?? c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                  </div>
                  {selectedId === c.id && (
                    <span className="shrink-0 text-xs text-primary">✓</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {selected && (
        <p className="mt-1.5 text-sm text-muted-foreground">
          เลือกแล้ว: <strong>{selected.lineDisplayName ?? selected.name}</strong> (ID: {selected.id})
        </p>
      )}
    </div>
  );
}
