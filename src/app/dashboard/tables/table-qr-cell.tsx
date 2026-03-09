"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateTableQrTokenAction } from "@/features/table/table.actions";
import { Button } from "@/components/ui/button";

type Props = {
  tableId: number;
  tableNumber: string;
  qrToken?: string | null;
};

export function TableQrCell({ tableId, tableNumber, qrToken: initialQrToken }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tokenAfterGen, setTokenAfterGen] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const displayToken = tokenAfterGen ?? initialQrToken ?? null;

  async function handleGenQr() {
    setLoading(true);
    const result = await generateTableQrTokenAction(tableId);
    setLoading(false);
    if (result.error) {
      alert(result.error);
      return;
    }
    if (result.token) {
      setTokenAfterGen(result.token);
      setOpen(true);
      router.refresh();
    }
  }

  const orderUrl =
    typeof window !== "undefined" && displayToken
      ? `${window.location.origin}/order/${displayToken}`
      : "";
  const qrImageUrl = orderUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(orderUrl)}`
    : "";
  const qrImageUrlLarge = orderUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(orderUrl)}`
    : "";

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {displayToken && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex flex-col items-center gap-1 rounded-lg border p-2 transition-colors hover:bg-muted/80"
            title="ดู / สแกน / โหลด QR"
          >
            {qrImageUrl && (
              <img
                src={qrImageUrl}
                alt={`QR โต๊ะ ${tableNumber}`}
                width={64}
                height={64}
                className="rounded border"
              />
            )}
            <span className="text-muted-foreground text-xs">ดู QR</span>
          </button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenQr}
          disabled={loading}
        >
          {loading ? "กำลังสร้าง…" : "Gen QR"}
        </Button>
      </div>

      {open && displayToken && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 font-semibold">QR โต๊ะ {tableNumber}</h3>
            <p className="mb-4 text-muted-foreground text-sm">
              ลูกค้าสแกน QR นี้เพื่อสั่งอาหารโต๊ะนี้
            </p>
            {qrImageUrlLarge && (
              <div className="mb-4 flex flex-col items-center gap-2">
                <img
                  src={qrImageUrlLarge}
                  alt="QR Code"
                  width={200}
                  height={200}
                  className="rounded border"
                />
                <a
                  href={qrImageUrlLarge}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={`qr-table-${tableNumber}.png`}
                  className="text-primary text-sm underline hover:no-underline"
                >
                  โหลดรูป QR
                </a>
              </div>
            )}
            <p className="mb-4 break-all font-mono text-xs text-muted-foreground">
              {orderUrl}
            </p>
            <p className="mb-4 text-amber-600 text-xs dark:text-amber-400">
              กด Gen QR ใหม่จะทำให้ QR เก่าใช้ไม่ได้
            </p>
            <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
              ปิด
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
