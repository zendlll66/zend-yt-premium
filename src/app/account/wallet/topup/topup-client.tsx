"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CreditCard, Building2, QrCode, Upload, CheckCircle2 } from "lucide-react";
import { ImageUpload } from "@/components/image-upload";

const PRESET_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

type Step = "select" | "bank-details" | "slip-upload" | "done";

interface BankInfo {
  topupId: number;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  promptPayId?: string;
  qrImageUrl?: string;
  amount: number;
}

export function TopupClient({
  stripeEnabled,
  bankEnabled,
}: {
  stripeEnabled: boolean;
  bankEnabled: boolean;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [step, setStep] = useState<Step>("select");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [slipUploaded, setSlipUploaded] = useState(false);
  const [slipImageUrl, setSlipImageUrl] = useState("");

  const selectedAmount =
    amount ?? (customAmount ? parseInt(customAmount.replace(/\D/g, ""), 10) || null : null);

  async function handlePay(method: "stripe" | "bank") {
    if (!selectedAmount || selectedAmount < 20) {
      setError("จำนวนเงินขั้นต่ำ 20 บาท");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: selectedAmount, method }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "เกิดข้อผิดพลาด");
        return;
      }
      if (method === "stripe" && data.url) {
        window.location.href = data.url;
      } else if (method === "bank") {
        setBankInfo(data);
        setStep("bank-details");
      }
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitSlip() {
    if (!bankInfo || !slipImageUrl) {
      setError("กรุณาอัปโหลดสลิปก่อน");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.set("topupId", String(bankInfo.topupId));
      fd.set("slipImageUrl", slipImageUrl);
      const { uploadTopupSlipAction } = await import(
        "@/features/wallet/wallet-topup.actions"
      );
      const result = await uploadTopupSlipAction({}, fd);
      if (result.error) {
        setError(result.error);
        return;
      }
      setStep("done");
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  if (step === "done") {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center space-y-4">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
        <h2 className="text-lg font-semibold">ส่งสลิปสำเร็จ</h2>
        <p className="text-sm text-muted-foreground">
          ทีมงานจะตรวจสอบและเติมเงินเข้า Wallet ของคุณภายใน 24 ชั่วโมง
        </p>
        <Button onClick={() => router.push("/account/wallet")}>กลับหน้า Wallet</Button>
      </div>
    );
  }

  if (step === "bank-details" && bankInfo) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border bg-card p-5 space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            ข้อมูลการโอนเงิน
          </h2>
          <p className="text-sm text-muted-foreground">
            จำนวนเงิน: <span className="font-bold text-foreground">฿{bankInfo.amount.toLocaleString("th-TH")}</span>
          </p>
          {bankInfo.qrImageUrl && (
            <div className="flex justify-center">
              <img src={bankInfo.qrImageUrl} alt="QR PromptPay" className="w-48 h-48 rounded-xl border" />
            </div>
          )}
          {bankInfo.bankAccountNumber && (
            <div className="rounded-xl bg-muted p-3 space-y-1 text-sm">
              {bankInfo.bankName && <p>ธนาคาร: <span className="font-medium">{bankInfo.bankName}</span></p>}
              {bankInfo.bankAccountName && <p>ชื่อบัญชี: <span className="font-medium">{bankInfo.bankAccountName}</span></p>}
              <p>เลขบัญชี: <span className="font-mono font-bold">{bankInfo.bankAccountNumber}</span></p>
            </div>
          )}
          {bankInfo.promptPayId && (
            <p className="text-sm">PromptPay: <span className="font-mono font-bold">{bankInfo.promptPayId}</span></p>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-5 space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Upload className="h-4 w-4" />
            อัปโหลดสลิป
          </h2>
          <ImageUpload
            folder="wallet-slips"
            value={slipImageUrl}
            onChange={(key) => {
              setSlipImageUrl(key);
              setSlipUploaded(!!key);
            }}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            onClick={handleSubmitSlip}
            disabled={!slipUploaded || loading}
            className="w-full"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            ยืนยันการโอนเงิน
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Amount Selection */}
      <div className="rounded-2xl border bg-card p-5 space-y-3">
        <h2 className="font-semibold">เลือกจำนวนเงิน</h2>
        <div className="grid grid-cols-3 gap-2">
          {PRESET_AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => { setAmount(a); setCustomAmount(""); }}
              className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                amount === a && !customAmount
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-muted"
              }`}
            >
              ฿{a.toLocaleString("th-TH")}
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">฿</span>
          <Input
            type="number"
            min={20}
            step={1}
            placeholder="จำนวนอื่น (ขั้นต่ำ 20)"
            className="pl-7"
            value={customAmount}
            onChange={(e) => { setCustomAmount(e.target.value); setAmount(null); }}
          />
        </div>
        {selectedAmount && (
          <p className="text-sm text-muted-foreground">
            ยอดที่จะเติม: <span className="font-bold text-foreground">฿{selectedAmount.toLocaleString("th-TH")}</span>
          </p>
        )}
      </div>

      {/* Payment Method */}
      <div className="rounded-2xl border bg-card p-5 space-y-3">
        <h2 className="font-semibold">วิธีชำระเงิน</h2>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-col gap-2">
          {stripeEnabled && (
            <Button
              onClick={() => handlePay("stripe")}
              disabled={!selectedAmount || loading}
              className="w-full gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              ชำระผ่านบัตรเครดิต / Stripe
            </Button>
          )}
          {bankEnabled && (
            <Button
              variant="outline"
              onClick={() => handlePay("bank")}
              disabled={!selectedAmount || loading}
              className="w-full gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
              โอนธนาคาร / PromptPay
            </Button>
          )}
          {!stripeEnabled && !bankEnabled && (
            <p className="text-sm text-muted-foreground text-center py-2">
              ยังไม่เปิดรับการชำระเงิน กรุณาติดต่อแอดมิน
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
