import "dotenv/config";
import { hash } from "bcryptjs";
import { db } from "@/db";
import { adminUsers } from "@/db/schema/admin-user.schema";

const DEFAULT_ADMIN = {
  name: "ZEnd",
  email: "kittithat.dev@gmail.com",
  password: "0956433948ZEnd!",
  role: "super_admin" as const,
};

export async function seed(): Promise<void> {
  const passwordHash = await hash(DEFAULT_ADMIN.password, 10);

  await db
    .insert(adminUsers)
    .values({
      name: DEFAULT_ADMIN.name,
      email: DEFAULT_ADMIN.email,
      password: passwordHash,
      role: DEFAULT_ADMIN.role,
    })
    .onConflictDoNothing({ target: adminUsers.email });

  console.log("Seed done. Admin user:", DEFAULT_ADMIN.email);
}

const isMain = process.argv[1]?.replace(/\\/g, "/").endsWith("seed.ts");
if (isMain) {
  seed().catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  });
}
