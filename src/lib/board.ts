import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { assignments, streets, users } from "@/db/schema";
import { getDefaultCampaign } from "./campaign";

export type BoardRow = {
  streetId: string;
  name: string;
  status: "open" | "reserved" | "completed";
  assigneeId: string | null;
  username: string | null;
  reservedAt: Date | null;
  completedAt: Date | null;
};

export type BoardLoadResult = {
  campaignName: string | null;
  rows: BoardRow[];
  /** Set when the database query fails (wrong URL, SSL, missing tables, etc.) */
  dbError?: string;
};

const DB_HINT =
  "Check Vercel → Settings → Environment Variables → DATABASE_URL. Use the exact string from Neon (Production enabled). Then on your computer put the same URL in .env.local and run: npm run db:migrate && npm run db:seed";

/** Maps driver/Postgres errors to safe, actionable hints (no secrets). */
function dbFailureHint(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/does not exist/i.test(msg) && /relation|table/i.test(msg)) {
    return " Likely cause: tables not created yet. On your machine, with the same DATABASE_URL as Vercel in .env.local, run: npm run db:migrate && npm run db:seed";
  }
  if (/password authentication failed|28P01/i.test(msg)) {
    return " Likely cause: wrong database user or password in DATABASE_URL. Reset the password in Neon, update Vercel, redeploy.";
  }
  if (/getaddrinfo|ENOTFOUND|EAI_AGAIN/i.test(msg)) {
    return " Likely cause: hostname in DATABASE_URL is wrong or unreachable.";
  }
  if (/channel binding|channel_binding/i.test(msg)) {
    return " Likely cause: channel binding. In Vercel, edit DATABASE_URL and remove &channel_binding=require (use Neon’s default “copy connection string”).";
  }
  if (/DATABASE_URL is not set/i.test(msg)) {
    return " Likely cause: DATABASE_URL is missing for this deployment. Add it under Environment Variables for Production and redeploy.";
  }
  if (/self signed certificate|unable to verify|certificate/i.test(msg)) {
    return " Likely cause: SSL. Use Neon’s URL with sslmode=require as copied from the dashboard.";
  }
  return "";
}

function sanitizeDriverMessage(msg: string): string {
  return msg
    .replace(/postgresql:\/\/[^\s"'`]+/gi, "postgresql://…")
    .replace(/npg_[A-Za-z0-9]+/g, "…")
    .slice(0, 320);
}

function formatDbError(prefix: string, e: unknown): string {
  const hint = dbFailureHint(e);
  const raw = e instanceof Error ? e.message : String(e);
  const detail = hint ? "" : ` Details: ${sanitizeDriverMessage(raw)}`;
  return hint
    ? `${prefix}${hint} Still stuck? ${DB_HINT}`
    : `${prefix}${detail} ${DB_HINT}`;
}

export async function loadBoardRows(): Promise<BoardLoadResult> {
  try {
    const campaign = await getDefaultCampaign();
    if (!campaign) {
      return { campaignName: null, rows: [] };
    }

    const rows = await db
      .select({
        streetId: streets.id,
        name: streets.name,
        status: assignments.status,
        assigneeId: assignments.userId,
        username: users.username,
        reservedAt: assignments.reservedAt,
        completedAt: assignments.completedAt,
      })
      .from(streets)
      .innerJoin(assignments, eq(assignments.streetId, streets.id))
      .leftJoin(users, eq(users.id, assignments.userId))
      .where(eq(streets.campaignId, campaign.id))
      .orderBy(asc(streets.sortOrder), asc(streets.name));

    return { campaignName: campaign.name, rows };
  } catch (e) {
    console.error("[loadBoardRows]", e);
    return {
      campaignName: null,
      rows: [],
      dbError: formatDbError("Could not load data from the database.", e),
    };
  }
}

export type UserStreetsLoadResult = {
  rows: BoardRow[];
  dbError?: string;
};

export async function loadUserStreetRows(
  userId: string,
): Promise<UserStreetsLoadResult> {
  try {
    const campaign = await getDefaultCampaign();
    if (!campaign) return { rows: [] };

    const rows = await db
      .select({
        streetId: streets.id,
        name: streets.name,
        status: assignments.status,
        assigneeId: assignments.userId,
        username: users.username,
        reservedAt: assignments.reservedAt,
        completedAt: assignments.completedAt,
      })
      .from(streets)
      .innerJoin(assignments, eq(assignments.streetId, streets.id))
      .leftJoin(users, eq(users.id, assignments.userId))
      .where(
        and(eq(streets.campaignId, campaign.id), eq(assignments.userId, userId)),
      )
      .orderBy(asc(streets.sortOrder), asc(streets.name));

    return { rows };
  } catch (e) {
    console.error("[loadUserStreetRows]", e);
    return {
      rows: [],
      dbError: formatDbError("Could not load your streets.", e),
    };
  }
}
