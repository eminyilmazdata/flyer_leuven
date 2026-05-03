import "./load-env";
import { readFileSync } from "fs";
import { join } from "path";
import { eq, max } from "drizzle-orm";
import { db } from "../src/db";
import {
  assignments,
  campaigns,
  streets,
} from "../src/db/schema";
import { DEFAULT_CAMPAIGN_SLUG } from "../src/lib/constants";

type SeedRow = { name: string };

function readSeedList(): SeedRow[] {
  const raw = readFileSync(
    join(process.cwd(), "data", "streets-seed.json"),
    "utf8",
  );
  return JSON.parse(raw) as SeedRow[];
}

function streetDedupeKey(name: string): string {
  return name.normalize("NFKC").trim().toLowerCase();
}

/** Add streets from seed that are not yet in this campaign (match by NFKC trim + lower). */
async function syncStreetsFromSeed(campaignId: string) {
  const list = readSeedList();
  const namesFromSeed: string[] = [];
  const seenInSeed = new Set<string>();
  for (const row of list) {
    const rawName = row?.name;
    if (typeof rawName !== "string") continue;
    const name = rawName.trim();
    if (!name) continue;
    const key = streetDedupeKey(name);
    if (seenInSeed.has(key)) continue;
    seenInSeed.add(key);
    namesFromSeed.push(name);
  }

  const existingRows = await db
    .select({ name: streets.name })
    .from(streets)
    .where(eq(streets.campaignId, campaignId));

  const existingKeys = new Set(
    existingRows.map((r) => streetDedupeKey(r.name)),
  );

  const maxRow = await db
    .select({ m: max(streets.sortOrder) })
    .from(streets)
    .where(eq(streets.campaignId, campaignId));
  let nextOrder = Number(maxRow[0]?.m ?? -1) + 1;

  let added = 0;
  for (const name of namesFromSeed) {
    const key = streetDedupeKey(name);
    if (existingKeys.has(key)) continue;
    existingKeys.add(key);

    const [street] = await db
      .insert(streets)
      .values({
        campaignId: campaignId,
        name,
        sortOrder: nextOrder,
      })
      .returning({ id: streets.id });
    nextOrder += 1;
    if (street?.id) {
      await db.insert(assignments).values({ streetId: street.id, status: "open" });
      added += 1;
    }
  }

  if (added === 0) {
    console.log(
      `Campaign exists — all ${namesFromSeed.length} seed street names are already in the database (case-insensitive match).`,
    );
  } else {
    console.log(
      `Campaign exists — added ${added} new street(s) from data/streets-seed.json (${namesFromSeed.length} unique names in file, ${existingRows.length} row(s) in DB before sync).`,
    );
  }
}

async function main() {
  const existing = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(eq(campaigns.slug, DEFAULT_CAMPAIGN_SLUG))
    .limit(1);

  if (existing.length) {
    const id = existing[0]?.id;
    if (!id) throw new Error("Campaign row missing id");
    await syncStreetsFromSeed(id);
    return;
  }

  const list = readSeedList();

  const [campaign] = await db
    .insert(campaigns)
    .values({
      name: "Leuven city center",
      slug: DEFAULT_CAMPAIGN_SLUG,
    })
    .returning({ id: campaigns.id });

  if (!campaign) throw new Error("Failed to create campaign");

  let inserted = 0;
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
      inserted += 1;
    }
  }

  console.log(`Seeded campaign + ${inserted} streets.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
