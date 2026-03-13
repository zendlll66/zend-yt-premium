import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs } from "@/db/schema/audit-log.schema";
import { adminUsers } from "@/db/schema/admin-user.schema";

export type AuditLogEntry = {
  id: number;
  adminUserId: number | null;
  adminName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  createdAt: Date | null;
};

export async function createAuditLog(params: {
  adminUserId?: number | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: string | null;
}) {
  const baseValues = {
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId ?? null,
    details: params.details ?? null,
  };

  try {
    const [row] = await db
      .insert(auditLogs)
      .values({
        ...baseValues,
        adminUserId: params.adminUserId ?? null,
      })
      .returning();
    return row ?? null;
  } catch (error) {
    // If admin_user_id is stale (FK mismatch) or insert fails for any reason,
    // fallback to system log (adminUserId = null) so business flow won't crash.
    try {
      const [row] = await db
        .insert(auditLogs)
        .values({
          ...baseValues,
          adminUserId: null,
        })
        .returning();
      return row ?? null;
    } catch (fallbackError) {
      console.error("[AUDIT] Failed to write audit log", {
        error,
        fallbackError,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
      });
      return null;
    }
  }
}

export async function findRecentAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
  try {
    const rows = await db
      .select({
        id: auditLogs.id,
        adminUserId: auditLogs.adminUserId,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        details: auditLogs.details,
        createdAt: auditLogs.createdAt,
        adminName: adminUsers.name,
      })
      .from(auditLogs)
      .leftJoin(adminUsers, eq(auditLogs.adminUserId, adminUsers.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);

    return rows.map((r) => ({
      id: r.id,
      adminUserId: r.adminUserId ?? null,
      adminName: r.adminName ?? null,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId ?? null,
      details: r.details ?? null,
      createdAt: r.createdAt ?? null,
    }));
  } catch {
    return [];
  }
}
