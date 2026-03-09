import { createClient } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";

let _db: LibSQLDatabase | null = null;

function getDb(): LibSQLDatabase {
  if (_db) return _db;
  const url = process.env.TURSO_CONNECTION_URL;
  if (!url || url === "undefined") {
    throw new Error(
      "TURSO_CONNECTION_URL is not set. Add it to .env in the project root and restart the dev server."
    );
  }
  const turso = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  _db = drizzle(turso);
  return _db;
}

/** Lazy-initialized so process.env is read when the first query runs (env is available in request context). */
export const db = new Proxy({} as LibSQLDatabase, {
  get(_, prop) {
    return (getDb() as Record<string | symbol, unknown>)[prop];
  },
});
