/**
 * ทดสอบ GET /api/cron/inventory-notify
 *
 * ใช้งาน:
 *   npm run test:inventory-notify
 *   npm run test:inventory-notify -- --debug
 *   npm run test:inventory-notify -- --url=https://your-app.vercel.app --debug
 *
 * อ่านจาก .env: CRON_SECRET (ถ้ามีจะส่ง Authorization), INVENTORY_NOTIFY_URL (ถ้าไม่ระบุใช้ localhost:3000)
 */
import "dotenv/config";

function argUrl(): string | undefined {
  const a = process.argv.find((x) => x.startsWith("--url="));
  return a ? a.slice("--url=".length) : undefined;
}

function argDebug(): boolean {
  return process.argv.includes("--debug");
}

async function main(): Promise<void> {
  const fromArg = argUrl();
  const base =
    fromArg ??
    (process.env.INVENTORY_NOTIFY_URL?.trim() ||
      "http://localhost:3000/api/cron/inventory-notify");

  let url = base.includes("/api/cron/inventory-notify")
    ? base
    : `${base.replace(/\/$/, "")}/api/cron/inventory-notify`;

  if (argDebug()) {
    const u = new URL(url);
    u.searchParams.set("debug", "1");
    url = u.toString();
  }

  const secret = process.env.CRON_SECRET?.trim();

  const headers = new Headers();
  if (secret) {
    headers.set("Authorization", `Bearer ${secret}`);
  }

  console.log(`→ GET ${url}`);
  if (!secret) {
    console.log(
      "  (ไม่มี CRON_SECRET ใน .env — ส่งแบบไม่มี Authorization; ถ้า server บังคับ secret จะได้ 401)\n"
    );
  }

  const res = await fetch(url, { method: "GET", headers });
  const text = await res.text();
  let pretty = text;
  try {
    pretty = JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    /* keep raw */
  }

  console.log(`← ${res.status} ${res.statusText}`);
  console.log(pretty);

  if (!res.ok) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
