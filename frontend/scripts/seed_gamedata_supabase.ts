/**
 * Bot gamedata seeder — upserts all PF2e reference content from Pathway/gamedata/
 * into the Supabase `gamedata` table.
 *
 * Safe to re-run at any time. Uses upsert on (category, slug) so fresh data
 * always wins — useful since Viv updates gamedata frequently outside of git.
 *
 * Usage (from web/frontend/):
 *   export $(grep -v '^#' .env.local | xargs)
 *   npx tsx scripts/seed_gamedata_supabase.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const GAMEDATA_DIR = path.resolve(__dirname, "../../../Pathway/gamedata");
const BATCH = 200;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running.\n" +
      "  export $(grep -v '^#' frontend/.env.local | xargs)"
  );
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function load<T = unknown>(filename: string): T {
  return JSON.parse(
    fs.readFileSync(path.join(GAMEDATA_DIR, filename), "utf8")
  ) as T;
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

interface GamedataRow {
  category: string;
  slug: string;
  name: string | null;
  data: Record<string, unknown>;
}

async function upsertBatches(rows: GamedataRow[]): Promise<number> {
  let total = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await db
      .from("gamedata")
      .upsert(chunk, { onConflict: "category,slug" });
    if (error) {
      console.error(`  ✗ offset ${i}: ${error.message}`);
    } else {
      total += chunk.length;
    }
  }
  return total;
}

// Most gamedata files follow { _meta?, <topKey>: { slug: entry } }
function seedSlugMap(
  category: string,
  filename: string,
  topKey: string
): GamedataRow[] {
  const file = load<Record<string, unknown>>(filename);
  const map = file[topKey] as Record<string, Record<string, unknown>> | undefined;
  if (!map || typeof map !== "object" || Array.isArray(map)) {
    console.warn(`  ⚠ ${filename}: expected object at key "${topKey}"`);
    return [];
  }
  return Object.entries(map).map(([slug, entry]) => ({
    category,
    slug,
    name: (entry?.name as string) ?? (entry?.Name as string) ?? null,
    data: entry as Record<string, unknown>,
  }));
}

// For files where the top-level value is an array (e.g. deities)
function seedArray(
  category: string,
  filename: string,
  topKey: string
): GamedataRow[] {
  const file = load<Record<string, unknown>>(filename);
  const arr = file[topKey] as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(arr)) {
    console.warn(`  ⚠ ${filename}: expected array at key "${topKey}"`);
    return [];
  }
  return arr
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => {
      const name = (entry.name as string) ?? "";
      const slug = (entry.slug as string) || toSlug(name);
      return { category, slug, name: name || null, data: entry };
    })
    .filter((r) => r.slug);
}

// ---------------------------------------------------------------------------
// Per-file seeders
// ---------------------------------------------------------------------------

async function seedCategory(
  category: string,
  filename: string,
  topKey: string,
  strategy: "slug_map" | "array" = "slug_map"
) {
  const rows =
    strategy === "array"
      ? seedArray(category, filename, topKey)
      : seedSlugMap(category, filename, topKey);

  if (rows.length === 0) {
    console.log(`  — ${category}: 0 rows (skipping)`);
    return;
  }
  const inserted = await upsertBatches(rows);
  console.log(`  ✓ ${category}: ${inserted}/${rows.length} rows`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Pathway gamedata seeder ===\n");

  // Standard slug-map files: { _meta?, <topKey>: { slug: entry } }
  await seedCategory("actions",         "actions.json",         "actions");
  await seedCategory("afflictions",     "afflictions.json",     "afflictions");
  await seedCategory("backgrounds",     "background.json",      "backgrounds");
  await seedCategory("class_features",  "class-features.json",  "class_features");
  await seedCategory("classes",         "classes.json",         "classes");
  await seedCategory("companions",      "companions.json",      "companions");
  await seedCategory("conditions",      "conditions.json",      "Conditions");
  await seedCategory("creature_extras", "creature-extras.json", "creature_extras");
  await seedCategory("domains",         "domains.json",         "domains");
  await seedCategory("familiars",       "familiars.json",       "familiars");
  await seedCategory("hazards",         "hazards.json",         "hazards");
  await seedCategory("heritages",       "heritages.json",       "by_slug");
  await seedCategory("kingdom",         "kingdom.json",         "kingdom");
  await seedCategory("languages",       "languages.json",       "languages");
  await seedCategory("planes",          "planes.json",          "planes");
  await seedCategory("relics",          "relics.json",          "relics");
  await seedCategory("rituals",         "rituals.json",         "rituals");
  await seedCategory("rules",           "rules.json",           "Rulebook");
  await seedCategory("siege_weapons",   "siege-weapons.json",   "siege_weapons");
  await seedCategory("skills",          "skills.json",          "skills");
  await seedCategory("sources",         "sources.json",         "sources");
  await seedCategory("traits",          "traits.json",          "traits");
  await seedCategory("vehicles",        "vehicles.json",        "vehicles");

  // Array format (top-level value is an array, not a slug-keyed object)
  await seedCategory("deities", "deities.json", "deities", "array");

  console.log("\n✓ Gamedata seeding complete!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
