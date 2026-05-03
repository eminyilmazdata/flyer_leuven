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

export async function loadBoardRows(): Promise<{
  campaignName: string | null;
  rows: BoardRow[];
}> {
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
}

export async function loadUserStreetRows(userId: string): Promise<BoardRow[]> {
  const campaign = await getDefaultCampaign();
  if (!campaign) return [];

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

  return rows;
}
