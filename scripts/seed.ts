import "./load-env";
import { readFileSync } from "fs";
import { join } from "path";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import {
  assignments,
  campaigns,
  streets,
} from "../src/db/schema";
import { DEFAULT_CAMPAIGN_SLUG } from "../src/lib/constants";

type SeedRow = { name: string };

async function main() {
  const existing = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(eq(campaigns.slug, DEFAULT_CAMPAIGN_SLUG))
    .limit(1);

  if (existing.length) {
    console.log("Seed skipped: campaign already exists.");
    return;
  }

  const raw = readFileSync(
    join(process.cwd(), "data", "streets-seed.json"),
    "utf8",
  );
  const list = JSON.parse(raw) as SeedRow[];

  const [campaign] = await db
    .insert(campaigns)
    .values({
      name: "Leuven city center",
      slug: DEFAULT_CAMPAIGN_SLUG,
    })
    .returning({ id: campaigns.id });

  if (!campaign) throw new Error("Failed to create campaign");

  for (let i = 0; i < list.length; i++) {
    const name = list[i]?.name?.trim();
    if (!name) continue;
    const [street] = await db
      .insert(streets)
      .values({
        campaignId: campaign.id,
        name,
        sortOrder: i,
      })
      .returning({ id: streets.id });
    if (street?.id) {
      await db.insert(assignments).values({ streetId: street.id, status: "open" });
    }
  }

  console.log(`Seeded campaign + ${list.length} streets.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
