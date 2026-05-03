import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { normalizeDatabaseUrl } from "@/db";

/**
 * Safe diagnostics for production DB issues (no secrets in response).
 * Open: GET /api/health/db
 */
export async function GET() {
  const raw = process.env.DATABASE_URL;
  const url = normalizeDatabaseUrl(raw);
  const databaseUrlSet = Boolean(url);

  let host: string | null = null;
  if (url) {
    try {
      host = new URL(url).hostname;
    } catch {
      host = "(invalid URL format)";
    }
  }

  if (!url) {
    return NextResponse.json(
      {
        ok: false,
        databaseUrlSet: false,
        host: null,
        message:
          "DATABASE_URL is empty after trim. In Vercel → Settings → Environment Variables, add DATABASE_URL for Production and redeploy.",
      },
      { status: 503 },
    );
  }

  try {
    const sql = neon(url);
    await sql`select 1 as ok`;
    return NextResponse.json({
      ok: true,
      databaseUrlSet: true,
      host,
      message: "Connected to Postgres.",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const safe = msg
      .replace(/postgresql:\/\/[^\s"']+/gi, "postgresql://…")
      .replace(/npg_[A-Za-z0-9]+/g, "…")
      .slice(0, 400);
    return NextResponse.json(
      {
        ok: false,
        databaseUrlSet: true,
        host,
        message: safe,
        hints: [
          "If you see channel_binding: remove &channel_binding=require from DATABASE_URL in Vercel.",
          "Confirm “Production” is checked for DATABASE_URL, then Redeploy the latest production build.",
          "Run locally: npm run db:ping (with .env.local) — same URL as Vercel.",
        ],
      },
      { status: 503 },
    );
  }
}
