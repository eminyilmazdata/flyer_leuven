import "./load-env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { normalizeDatabaseUrl } from "./env-url";

async function main() {
  const url = normalizeDatabaseUrl(process.env.DATABASE_URL);
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }
  const sql = neon(url);
  const db = drizzle(sql);
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations applied.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
