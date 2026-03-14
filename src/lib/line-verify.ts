/**
 * Verify LINE LIFF id_token กับ LINE API
 * @see https://developers.line.biz/en/docs/line-login/verify-id-token/
 */
const LINE_VERIFY_URL = "https://api.line.me/oauth2/v2.1/verify";

export type LineIdTokenPayload = {
  iss: string;
  sub: string; // LINE User ID
  aud: string;
  exp: number;
  iat: number;
  name?: string;
  picture?: string;
  email?: string;
};

export type VerifyLineIdTokenResult =
  | { ok: true; payload: LineIdTokenPayload }
  | { ok: false; error: string };

/** อีเมล placeholder สำหรับลูกค้า LINE ที่ยังไม่ได้เพิ่มอีเมลในโปรไฟล์ */
export function isLinePlaceholderEmail(email: string): boolean {
  return (
    email.startsWith("line-") &&
    email.endsWith("@liff.user")
  );
}

export async function verifyLineIdToken(idToken: string): Promise<VerifyLineIdTokenResult> {
  const channelId = process.env.LINE_CHANNEL_ID?.trim();
  if (!channelId) {
    return { ok: false, error: "LINE_CHANNEL_ID ไม่ได้ตั้งค่าในเซิร์ฟเวอร์" };
  }

  const res = await fetch(LINE_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      id_token: idToken,
      client_id: channelId,
    }),
  });

  const body = (await res.json()) as LineIdTokenPayload | { error?: string; error_description?: string };
  if (!res.ok) {
    const msg = body && typeof (body as { error_description?: string }).error_description === "string"
      ? (body as { error_description: string }).error_description
      : "LINE ยืนยัน token ไม่ผ่าน (ตรวจสอบ LIFF Channel กับ LINE_CHANNEL_ID ว่าเป็น Channel เดียวกัน หรือ token หมดอายุ)";
    return { ok: false, error: msg };
  }
  if (!body || typeof (body as LineIdTokenPayload).sub !== "string") {
    return { ok: false, error: "LINE ส่งข้อมูลไม่ครบ" };
  }
  return { ok: true, payload: body as LineIdTokenPayload };
}
