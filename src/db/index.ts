import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/** Trim and strip wrapping quotes — common when pasting into Vercel UI. */
export function normalizeDatabaseUrl(raw: string | undefined): string {
  if (!raw) return "";
  let u = raw.trim();
  if (
    (u.startsWith('"') && u.endsWith('"')) ||
    (u.startsWith("'") && u.endsWith("'"))
  ) {
    u = u.slice(1, -1).trim();
  }
  return u;
}

function createDb() {
  const url = normalizeDatabaseUrl(process.env.DATABASE_URL);
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const sql = neon(url);
  return drizzle(sql, { schema });
}

type DB = ReturnType<typeof createDb>;

const globalForDb = globalThis as unknown as { db: DB | undefined };

function getDb(): DB {
  if (!globalForDb.db) {
    globalForDb.db = createDb();
  }
  return globalForDb.db;
}

/** Lazy proxy so importing `@/db` does not call `neon()` until the first query (build-safe). */
export const db = new Proxy({} as DB, {
  get(_target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance as object, prop, receiver);
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(instance);
    }
    return value;
  },
});
