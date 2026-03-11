import "dotenv/config";
import { PAGE_PERMISSIONS } from "@/config/permissions";
import {
  createPage,
  findPageByPath,
  updatePage,
} from "@/features/page-permission/page-permission.repo";

/** Sync หน้าจาก config เข้า DB: ไม่มีก็สร้าง มีอยู่แล้วก็อัปเดต label + roles ให้ตรง config */
async function seedPages() {
  for (const p of PAGE_PERMISSIONS) {
    const existing = await findPageByPath(p.path);
    if (existing) {
      await updatePage(existing.id, {
        label: p.label,
        roles: [...p.roles],
      });
      console.log("Updated page:", p.path);
    } else {
      await createPage({
        path: p.path,
        label: p.label,
        roles: [...p.roles],
      });
      console.log("Added page:", p.path);
    }
  }
  console.log("Seed pages done.");
}

seedPages().catch((e) => {
  console.error("Seed pages failed:", e);
  process.exit(1);
});
