import { eq } from "drizzle-orm";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { DEFAULT_CAMPAIGN_SLUG } from "./constants";

export async function getDefaultCampaign() {
  const rows = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.slug, DEFAULT_CAMPAIGN_SLUG))
    .limit(1);
  return rows[0] ?? null;
}
