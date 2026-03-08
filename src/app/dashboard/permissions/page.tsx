import {
  PAGE_PERMISSIONS,
  ROLE_LABELS,
  type Role,
} from "@/config/permissions";

export default function PermissionsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="text-xl font-semibold">สิทธิ์การเข้าถึงหน้า</h1>
      <p className="text-muted-foreground text-sm">
        ตารางด้านล่างแสดงว่าหน้าไหน role ไหนเข้าได้บ้าง
      </p>

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 font-medium">หน้า</th>
                <th className="px-4 py-3 font-medium">Path</th>
                <th className="px-4 py-3 font-medium">Role ที่เข้าได้</th>
              </tr>
            </thead>
            <tbody>
              {PAGE_PERMISSIONS.map((p) => (
                <tr key={p.path} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{p.label}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {p.path}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.roles.map((r) => (
                        <span
                          key={r}
                          className="inline-flex rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary"
                        >
                          {ROLE_LABELS[r as Role]}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
