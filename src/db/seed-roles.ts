import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { findRoleBySlug, createRole, updateRole } from "@/features/role/role.repo";

/** บทบาทสำหรับระบบร้านเช่า — ไม่มีก็สร้าง มีอยู่แล้วก็อัปเดต name + description */
const RENTAL_ROLES = [
  {
    slug: "super_admin",
    name: "Super Admin",
    description: "สิทธิ์สูงสุด จัดการทุกอย่างรวมถึงสิทธิ์การเข้าถึงและบทบาท",
  },
  {
    slug: "admin",
    name: "แอดมิน",
    description: "จัดการสินค้า หมวดหมู่ โปรโมชัน แผนสมาชิก ตั้งค่าร้าน",
  },
  {
    slug: "cashier",
    name: "แคชเชียร์",
    description: "ดูคำสั่งเช่า ลูกค้า จอแสดงผล ดำเนินการชำระเงิน",
  },
  {
    slug: "chef",
    name: "เชฟ",
    description: "ดูคำสั่งเช่า จอแสดงผล (เหมาะสำหรับทีมจัดเตรียมสินค้า)",
  },
];

/** สร้างตาราง roles (ใช้เมื่อยังไม่ได้รัน migration 0018) */
async function ensureRolesTable() {
  await db.run(sql.raw(`
    CREATE TABLE IF NOT EXISTS "roles" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "slug" text NOT NULL,
      "name" text NOT NULL,
      "description" text,
      "created_at" integer NOT NULL,
      "updated_at" integer NOT NULL
    )
  `));
  await db.run(sql.raw(`CREATE UNIQUE INDEX IF NOT EXISTS "roles_slug_unique" ON "roles" ("slug")`));
}

export async function seedRoles(): Promise<void> {
  console.log("Seeding roles for rental shop...");
  try {
    await findRoleBySlug("super_admin");
  } catch (e) {
    const msg = [e instanceof Error ? e.message : String(e), (e as { cause?: Error })?.cause?.message].filter(Boolean).join(" ");
    if (/no such table.*roles|roles.*no such table/i.test(msg)) {
      console.log("  Table 'roles' not found. Creating table...");
      await ensureRolesTable();
      console.log("  Table created. Inserting default roles...");
      for (const r of RENTAL_ROLES) {
        await createRole({ slug: r.slug, name: r.name, description: r.description ?? null });
        console.log("  Created role:", r.slug, "-", r.name);
      }
      console.log("Seed roles done.");
      return;
    }
    throw e;
  }
  for (const r of RENTAL_ROLES) {
    const existing = await findRoleBySlug(r.slug);
    if (existing) {
      await updateRole(existing.id, { name: r.name, description: r.description ?? null });
      console.log("  Updated role:", r.slug, "-", r.name);
    } else {
      await createRole({ slug: r.slug, name: r.name, description: r.description ?? null });
      console.log("  Created role:", r.slug, "-", r.name);
    }
  }
  console.log("Seed roles done.");
}

const isMain = process.argv[1]?.replace(/\\/g, "/").endsWith("seed-roles.ts");
if (isMain) {
  seedRoles().catch((e) => {
    console.error("Seed roles failed:", e);
    process.exit(1);
  });
}
