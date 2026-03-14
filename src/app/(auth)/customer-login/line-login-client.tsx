"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const LIFF_SDK_URL = "https://static.line-scdn.net/liff/edge/2/sdk.js";

declare global {
  interface Window {
    liff?: {
      init: (config: { liffId: string }) => Promise<void>;
      isLoggedIn: () => boolean;
      login: (params?: { redirectUri?: string }) => void;
      getIDToken: () => string | null;
      isInClient: () => boolean;
    };
  }
}

export function LineLoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/account";
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "success">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    if (!liffId) {
      setError("ไม่ได้ตั้งค่า LIFF ID");
      setStatus("error");
      return;
    }

    const script = document.createElement("script");
    script.src = LIFF_SDK_URL;
    script.async = true;
    script.onload = () => {
      const liff = window.liff;
      if (!liff) {
        setError("โหลด LINE SDK ไม่สำเร็จ");
        setStatus("error");
        return;
      }
      liff
        .init({ liffId })
        .then(async () => {
          if (!liff.isLoggedIn()) {
            const base =
              typeof process.env.NEXT_PUBLIC_LIFF_REDIRECT_URI !== "undefined"
                ? process.env.NEXT_PUBLIC_LIFF_REDIRECT_URI
                : process.env.NEXT_PUBLIC_APP_URL || "";
            const redirectUri = `${base.replace(/\/$/, "")}/customer-login${window.location.search || ""}`;
            liff.login({ redirectUri });
            return;
          }
          const idToken = liff.getIDToken();
          if (!idToken) {
            setError("ไม่สามารถรับข้อมูลจาก LINE ได้");
            setStatus("ready");
            return;
          }
          setStatus("loading");
          try {
            const res = await fetch("/api/auth/customer/line", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken }),
            });
            const data = (await res.json()) as { ok?: boolean; error?: string };
            if (res.ok) {
              setStatus("success");
              const fromParam = new URLSearchParams(window.location.search).get("from");
              const fromUrl = fromParam && fromParam.startsWith("/") && !fromParam.startsWith("//") ? fromParam : "/";
              window.location.href = fromUrl;
              return;
            }
            setError(data.error || "เข้าสู่ระบบไม่สำเร็จ");
          } catch {
            setError("เกิดข้อผิดพลาด");
          }
          setStatus("ready");
        })
        .catch(() => {
          setError("เริ่มต้น LINE ไม่สำเร็จ");
          setStatus("error");
        });
    };
    script.onerror = () => {
      setError("โหลด LINE SDK ไม่สำเร็จ");
      setStatus("error");
    };
    document.body.appendChild(script);
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  async function handleLogin() {
    const liff = window.liff;
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    if (!liff || !liffId) return;

    if (!liff.isLoggedIn()) {
      // ต้องตรงกับ Endpoint URL ใน LIFF (ถ้าใช้ https บน localhost ต้องใส่ NEXT_PUBLIC_LIFF_REDIRECT_URI=https://localhost:3000)
      const base =
        typeof process.env.NEXT_PUBLIC_LIFF_REDIRECT_URI !== "undefined"
          ? process.env.NEXT_PUBLIC_LIFF_REDIRECT_URI
          : process.env.NEXT_PUBLIC_APP_URL || "";
      const redirectUri = `${base.replace(/\/$/, "")}/customer-login${window.location.search || ""}`;
      liff.login({ redirectUri });
      return;
    }

    const idToken = liff.getIDToken();
    if (!idToken) {
      setError("ไม่สามารถรับข้อมูลจาก LINE ได้");
      return;
    }

    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/auth/customer/line", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error || "เข้าสู่ระบบไม่สำเร็จ");
        setStatus("ready");
        return;
      }
      setStatus("success");
      router.push(from);
      router.refresh();
    } catch {
      setError("เกิดข้อผิดพลาด");
      setStatus("ready");
    }
  }

  if (status === "error") {
    return (
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="mb-4 text-center text-xl font-semibold">เข้าสู่ระบบ</h1>
        <p className="mb-4 text-center text-sm text-destructive">{error}</p>
        <p className="text-center text-sm text-muted-foreground">
          กรุณาตั้งค่า NEXT_PUBLIC_LIFF_ID และ LINE_CHANNEL_ID ใน .env
        </p>
        <Button variant="outline" className="mt-4 w-full" asChild>
          <a href="/">กลับหน้าหลัก</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
      <h1 className="mb-6 text-center text-xl font-semibold">
        เข้าสู่ระบบด้วย LINE
      </h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        ระบบซื้อรหัส YouTube Premium — ใช้ LINE เข้าสู่ระบบหรือสมัครอัตโนมัติ
      </p>
      {status === "loading" && (
        <div className="flex justify-center py-4">
          <span className="text-sm text-muted-foreground">กำลังโหลด…</span>
        </div>
      )}
      {status === "ready" && (
        <>
          {error && (
            <p className="mb-4 text-center text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button
            className="w-full bg-[#06C755] hover:bg-[#05b34b]"
            onClick={handleLogin}
          >
            เข้าสู่ระบบด้วย LINE
          </Button>
        </>
      )}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <a href="/" className="hover:underline">กลับหน้าหลัก</a>
      </p>
    </div>
  );
}
