"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function MembershipCheckoutClient({
  planId,
  price,
  planName,
}: {
  planId: number;
  price: number;
  planName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "สร้างลิงก์ชำระเงินไม่สำเร็จ");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("เชื่อมต่อไม่สำเร็จ");
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      {error && (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button className="w-full" onClick={handlePay} disabled={loading}>
        {loading ? "กำลังดำเนินการ…" : "ชำระเงินด้วยบัตร (Stripe)"}
      </Button>
    </div>
  );
}
