/**
 * Pull named streets from OpenStreetMap (Overpass API) inside a bounding box.
 * Default box ≈ Leuven city center + Vaartkom / ring nearby (tweak OSM_BBOX).
 *
 * Usage:
 *   npm run streets:fetch
 *   OSM_BBOX=50.866,4.668,50.900,4.735 npm run streets:fetch
 *   STREETS_OUT=./data/streets-osm.json npm run streets:fetch
 *
 * Then replace or merge into data/streets-seed.json and re-seed a fresh DB, or
 * import names via the coordinator UI.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

/** south,west,north,east (WGS84) — default ≈ Leuven center + Vaartkom */
const DEFAULT_BBOX = "50.866,4.668,50.900,4.735";

/** highway=* values we treat as address-bearing streets (exclude motorways, paths, etc.) */
const HIGHWAY_ALLOW = new Set([
  "residential",
  "living_street",
  "unclassified",
  "tertiary",
  "tertiary_link",
  "secondary",
  "secondary_link",
  "primary",
  "primary_link",
  "trunk",
  "trunk_link",
  "pedestrian",
  "service",
  "road",
  "square",
]);

type OverpassElement = {
  type: string;
  tags?: { name?: string; highway?: string; place?: string };
};

function buildQuery(south: number, west: number, north: number, east: number) {
  // Ways with a street-like highway and a name inside bbox
  return `
[out:json][timeout:180];
(
  way["highway"]["name"](${south},${west},${north},${east});
);
out tags;
`.trim();
}

function parseBbox(raw: string): [number, number, number, number] {
  const parts = raw.split(",").map((s) => Number.parseFloat(s.trim()));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
    throw new Error(
      `Invalid OSM_BBOX "${raw}". Use south,west,north,east (e.g. ${DEFAULT_BBOX})`,
    );
  }
  const [south, west, north, east] = parts;
  if (south >= north || west >= east) {
    throw new Error("OSM_BBOX must have south < north and west < east");
  }
  return [south, west, north, east];
}

function primaryName(raw: string): string {
  const first = raw.split(";")[0]?.trim() ?? raw;
  return first.replace(/\s+/g, " ").trim();
}

/** Drop construction notes, arrows, and other non-street labels OSM sometimes carries. */
function isReasonableStreetName(n: string): boolean {
  if (n.length < 2 || n.length > 120) return false;
  if (/→|←/.test(n)) return false;
  if (/^\s*[-_>]+/u.test(n)) return false;
  if (/\bSPOED\b/i.test(n)) return false;
  const lettersOrDigits = n.match(/[\p{L}0-9]/gu)?.length ?? 0;
  if (lettersOrDigits < 2) return false;
  return true;
}

async function main() {
  const bbox = process.env.OSM_BBOX?.trim() || DEFAULT_BBOX;
  const [south, west, north, east] = parseBbox(bbox);
  const query = buildQuery(south, west, north, east);
  const outPath = resolve(
    process.cwd(),
    process.env.STREETS_OUT?.trim() || "data/streets-seed.json",
  );

  const url = process.env.OVERPASS_URL?.trim() || "https://overpass-api.de/api/interpreter";
  const res = await fetch(url, {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "flyer-leuven/1.0 (street list for community flyering)",
    },
  });

  if (!res.ok) {
    throw new Error(`Overpass HTTP ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as { elements?: OverpassElement[] };
  const elements = json.elements ?? [];

  const names = new Set<string>();
  for (const el of elements) {
    if (el.type !== "way" || !el.tags?.name) continue;
    const hw = el.tags.highway;
    if (!hw || !HIGHWAY_ALLOW.has(hw)) continue;
    const n = primaryName(el.tags.name);
    if (!isReasonableStreetName(n)) continue;
    names.add(n);
  }

  const sorted = [...names].sort((a, b) =>
    a.localeCompare(b, "nl", { sensitivity: "base" }),
  );
  const rows = sorted.map((name) => ({ name }));

  writeFileSync(outPath, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
  console.log(`Wrote ${rows.length} unique street names to ${outPath}`);
  console.log(
    "Tip: open https://www.openstreetmap.org/export#map and adjust OSM_BBOX if you need a tighter area.",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
