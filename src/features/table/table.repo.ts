import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { tables, type TableStatus } from "@/db/schema/table.schema";

export async function findAllTables() {
  return db.select().from(tables).orderBy(asc(tables.tableNumber));
}

export async function findTableById(id: number) {
  const [row] = await db.select().from(tables).where(eq(tables.id, id)).limit(1);
  return row ?? null;
}

export async function createTable(data: {
  tableNumber: string;
  status?: TableStatus;
  capacity?: number;
}) {
  const status: TableStatus = data.status ?? "available";
  const [row] = await db
    .insert(tables)
    .values({
      tableNumber: data.tableNumber,
      status,
      capacity: data.capacity ?? 4,
    })
    .returning();
  return row ?? null;
}

export async function updateTable(
  id: number,
  data: { tableNumber?: string; status?: TableStatus; capacity?: number; qrToken?: string | null }
) {
  const payload: Partial<{ tableNumber: string; status: TableStatus; capacity: number; qrToken: string | null }> = {};
  if (data.tableNumber != null) payload.tableNumber = data.tableNumber;
  if (data.status != null) payload.status = data.status;
  if (data.capacity != null) payload.capacity = data.capacity;
  if (data.qrToken !== undefined) payload.qrToken = data.qrToken;
  if (Object.keys(payload).length === 0) return findTableById(id);
  const [row] = await db
    .update(tables)
    .set(payload)
    .where(eq(tables.id, id))
    .returning();
  return row ?? null;
}

export async function findTableByQrToken(token: string) {
  const [row] = await db
    .select()
    .from(tables)
    .where(eq(tables.qrToken, token))
    .limit(1);
  return row ?? null;
}

export async function deleteTableById(id: number): Promise<boolean> {
  const [row] = await db.delete(tables).where(eq(tables.id, id)).returning({ id: tables.id });
  return row != null;
}
