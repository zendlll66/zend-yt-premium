import { createHmac } from "node:crypto";

export const CUSTOMER_COOKIE_NAME = "customer_session";
const SECRET =
  process.env.ADMIN_SESSION_SECRET || "dev-secret-change-in-production";

export function signCustomerSession(customerId: number): string {
  const idStr = String(customerId);
  const sig = createHmac("sha256", SECRET).update("customer:" + idStr).digest("hex");
  return `${idStr}.${sig}`;
}

export function verifyCustomerSessionCookie(value: string): number | null {
  const parts = value.split(".");
  if (parts.length !== 2) return null;
  const [idStr, sigHex] = parts;
  if (!idStr || !sigHex) return null;
  const expected = createHmac("sha256", SECRET).update("customer:" + idStr).digest("hex");
  if (expected !== sigHex) return null;
  const id = parseInt(idStr, 10);
  return Number.isFinite(id) ? id : null;
}
