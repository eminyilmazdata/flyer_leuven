/**
 * Quick check that DATABASE_URL works (same as Vercel / .env.local).
 * Usage: npm run db:ping
 */
import { neon } from "@neondatabase/serverless";
import "dotenv/config";

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("DATABASE_URL is missing. Add it to .env.local in the project root.");
    process.exit(1);
  }

  try {
    const parsed = new URL(url);
    console.log("Connecting to host:", parsed.hostname);
  } catch {
    console.log("DATABASE_URL is set (could not parse host for display).");
  }

  try {
    const sql = neon(url);
    const rows = await sql`select 1 as ok`;
    console.log("Database OK:", rows);
  } catch (e) {
    console.error("Database connection FAILED:");
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }
}

main();
