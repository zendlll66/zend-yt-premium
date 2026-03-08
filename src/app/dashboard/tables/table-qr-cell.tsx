"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateTableQrTokenAction } from "@/features/table/table.actions";
import { Button } from "@/components/ui/button";

type Props = { tableId: number; tableNumber: string };

export function TableQrCell({ tableId, tableNumber }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenQr() {
    setLoading(true);
    const result = await generateTableQrTokenAction(tableId);
    setLoading(false);
    if (result.error) {
      alert(result.error);
      return;
    }
    if (result.token) {
      setToken(result.token);
      setOpen(true);
      router.refresh();
    }
  }

  const orderUrl =
    typeof window !== "undefined" && token
      ? `${window.location.origin}/order/${token}`
      : "";
  const qrImageUrl = orderUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(orderUrl)}`
    : "";

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleGenQr}
        disabled={loading}
      >
        {loading ? "กำลังสร้าง…" : "Gen QR"}
      </Button>

      {open && token && (
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
            {qrImageUrl && (
              <div className="mb-4 flex justify-center">
                <img
                  src={qrImageUrl}
                  alt="QR Code"
                  width={200}
                  height={200}
                  className="rounded border"
                />
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
