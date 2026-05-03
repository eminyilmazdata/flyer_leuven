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
  "Check Vercel → Settings → Environment Variables → DATABASE_URL (Neon pooled URL). Then from your computer run: npm run db:migrate && npm run db:seed (with the same DATABASE_URL in .env.local).";

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
      dbError: `Could not load data from the database. ${DB_HINT}`,
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
      dbError: `Could not load your streets. ${DB_HINT}`,
    };
  }
}
