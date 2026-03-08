import { createHmac } from "node:crypto";

export const COOKIE_NAME = "admin_session";
export const SECRET =
  process.env.ADMIN_SESSION_SECRET || "dev-secret-change-in-production";

/** Create signed session cookie value (Node only - for API routes) */
export function signSessionCookie(userId: number): string {
  const idStr = String(userId);
  const sig = createHmac("sha256", SECRET).update(idStr).digest("hex");
  return `${idStr}.${sig}`;
}
