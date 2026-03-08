import "dotenv/config";
import { PAGE_PERMISSIONS } from "@/config/permissions";
import { createPage } from "@/features/page-permission/page-permission.repo";
import { findPageByPath } from "@/features/page-permission/page-permission.repo";

async function seedPages() {
  for (const p of PAGE_PERMISSIONS) {
    const existing = await findPageByPath(p.path);
    if (existing) continue;
    await createPage({
      path: p.path,
      label: p.label,
      roles: [...p.roles],
    });
    console.log("Added page:", p.path);
  }
  console.log("Seed pages done.");
}

seedPages().catch((e) => {
  console.error("Seed pages failed:", e);
  process.exit(1);
});
