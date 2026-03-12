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

/** อีเมล placeholder สำหรับลูกค้า LINE ที่ยังไม่ได้เพิ่มอีเมลในโปรไฟล์ */
export function isLinePlaceholderEmail(email: string): boolean {
  return (
    email.startsWith("line-") &&
    email.endsWith("@liff.user")
  );
}

export async function verifyLineIdToken(idToken: string): Promise<LineIdTokenPayload | null> {
  const channelId = process.env.LINE_CHANNEL_ID;
  if (!channelId) return null;

  const res = await fetch(LINE_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      id_token: idToken,
      client_id: channelId,
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as LineIdTokenPayload;
  if (!data?.sub) return null;
  return data;
}
