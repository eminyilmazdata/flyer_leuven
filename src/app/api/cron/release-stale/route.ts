import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { assignments } from "@/db/schema";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const hours = Math.min(
    168,
    Math.max(1, Math.floor(Number(process.env.STALE_RESERVATION_HOURS ?? 48))),
  );

  const updated = await db
    .update(assignments)
    .set({
      status: "open",
      userId: null,
      reservedAt: null,
    })
    .where(
      and(
        eq(assignments.status, "reserved"),
        sql`${assignments.reservedAt} < now() - interval '1 hour' * ${hours}`,
      ),
    )
    .returning({ streetId: assignments.streetId });

  return NextResponse.json({ ok: true, released: updated.length });
}
