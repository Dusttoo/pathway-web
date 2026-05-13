/**
 * Nethys -> Supabase seeder.
 *
 * Fetches official PF2e content from elasticsearch.aonprd.com, transforms it
 * into our table shapes, and upserts via service-role keyed on `aon_id`.
 *
 * Usage (from web/frontend/):
 *   export $(grep -v '^#' .env.local | xargs)
 *   npx tsx scripts/seed_nethys.ts                   # everything
 *   npx tsx scripts/seed_nethys.ts --only=feats      # one category
 *   npx tsx scripts/seed_nethys.ts --only=feats,spells
 *   npx tsx scripts/seed_nethys.ts --refresh         # bypass on-disk cache
 *   npx tsx scripts/seed_nethys.ts --limit=50        # smoke test
 *   npx tsx scripts/seed_nethys.ts --dry-run         # transform but don't write
 *
 * Safe to re-run: official rows (is_official=true) are upserted on aon_id.
 * Homebrew rows (is_official=false) are never touched.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { fetchCategory, type NethysCategory, type NethysDoc } from "./nethys/fetch";
import {
  transformFeat,
  transformSpell,
  transformItem,
  transformAncestry,
  transformBackground,
  transformArchetype,
  transformAction,
  transformCondition,
} from "./nethys/transform";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const BATCH = 200;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running.\n" +
      "  export $(grep -v '^#' frontend/.env.local | xargs)"
  );
  process.exit(1);
}

const db: SupabaseClient = createClient(SUPABASE_URL, SERVICE_KEY);

// ── CLI parsing ───────────────────────────────────────────────

type Args = { only: string[] | null; refresh: boolean; limit: number | null; dryRun: boolean };

function parseArgs(argv: string[]): Args {
  const out: Args = { only: null, refresh: false, limit: null, dryRun: false };
  for (const a of argv) {
    if (a === "--refresh") out.refresh = true;
    else if (a === "--dry-run") out.dryRun = true;
    else if (a.startsWith("--only=")) out.only = a.slice("--only=".length).split(",").filter(Boolean);
    else if (a.startsWith("--limit=")) out.limit = parseInt(a.slice("--limit=".length), 10);
  }
  return out;
}

// ── upsert helper ─────────────────────────────────────────────

async function upsertBatch(
  table: string,
  rows: Record<string, unknown>[],
  conflict: string,
  dryRun: boolean
): Promise<void> {
  if (rows.length === 0) return;
  if (dryRun) {
    console.log(`  (dry-run) would upsert ${rows.length} into ${table} on ${conflict}`);
    return;
  }
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const { error } = await db.from(table).upsert(slice, { onConflict: conflict });
    if (error) {
      console.error(`  ✗ ${table} batch ${i / BATCH}: ${error.message}`);
      throw error;
    }
  }
  console.log(`  ✓ ${table}: upserted ${rows.length}`);
}

// ── per-category seeders ──────────────────────────────────────

type Seeder = {
  key: string;
  category: NethysCategory;
  table: string;
  conflict: string;
  transform: (doc: NethysDoc) => Record<string, unknown>;
  filter?: (row: Record<string, unknown>) => boolean;
};

const SEEDERS: Seeder[] = [
  {
    key: "ancestries",
    category: "ancestry",
    table: "ancestries",
    conflict: "aon_id",
    transform: transformAncestry,
  },
  {
    key: "backgrounds",
    category: "background",
    table: "backgrounds",
    conflict: "aon_id",
    transform: transformBackground,
  },
  {
    key: "archetypes",
    category: "archetype",
    table: "archetypes",
    conflict: "aon_id",
    transform: transformArchetype,
  },
  {
    key: "feats",
    category: "feat",
    table: "feats",
    conflict: "aon_id",
    transform: transformFeat,
    filter: (r) => !!r.name,
  },
  {
    key: "spells",
    category: "spell",
    table: "spells",
    conflict: "aon_id",
    transform: transformSpell,
    filter: (r) => !!r.name,
  },
  {
    key: "rituals",
    category: "ritual",
    table: "spells",
    conflict: "aon_id",
    transform: transformSpell,
    filter: (r) => !!r.name,
  },
  {
    key: "focus",
    category: "focus",
    table: "spells",
    conflict: "aon_id",
    transform: transformSpell,
    filter: (r) => !!r.name,
  },
  {
    key: "equipment",
    category: "equipment",
    table: "items",
    conflict: "aon_id",
    transform: transformItem,
    filter: (r) => !!r.name,
  },
  {
    key: "weapons",
    category: "weapon",
    table: "items",
    conflict: "aon_id",
    transform: transformItem,
    filter: (r) => !!r.name,
  },
  {
    key: "armor",
    category: "armor",
    table: "items",
    conflict: "aon_id",
    transform: transformItem,
    filter: (r) => !!r.name,
  },
  {
    key: "shields",
    category: "shield",
    table: "items",
    conflict: "aon_id",
    transform: transformItem,
    filter: (r) => !!r.name,
  },
  {
    key: "actions",
    category: "action",
    table: "actions",
    conflict: "aon_id",
    transform: transformAction,
    filter: (r) => !!r.name,
  },
  {
    key: "conditions",
    category: "condition",
    table: "conditions",
    conflict: "aon_id",
    transform: transformCondition,
    filter: (r) => !!r.name,
  },
];

async function runSeeder(seeder: Seeder, args: Args): Promise<void> {
  console.log(`\n→ ${seeder.key} (${seeder.category})`);
  const docs = await fetchCategory(seeder.category, {
    refresh: args.refresh,
    limit: args.limit ?? undefined,
  });
  console.log(`  fetched ${docs.length} docs`);

  const rows: Record<string, unknown>[] = [];
  for (const d of docs) {
    try {
      const r = seeder.transform(d);
      if (seeder.filter && !seeder.filter(r)) continue;
      rows.push(r);
    } catch (e) {
      console.warn(`  ! transform failed for ${d._id}: ${(e as Error).message}`);
    }
  }

  await upsertBatch(seeder.table, rows, seeder.conflict, args.dryRun);
}

// ── main ──────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const selected = args.only
    ? SEEDERS.filter((s) => args.only!.includes(s.key))
    : SEEDERS;

  if (args.only && selected.length === 0) {
    console.error(`Unknown --only value. Choices: ${SEEDERS.map((s) => s.key).join(", ")}`);
    process.exit(1);
  }

  console.log(
    `Nethys seed: ${selected.map((s) => s.key).join(", ")}` +
      (args.refresh ? " (refresh)" : "") +
      (args.limit ? ` (limit=${args.limit})` : "") +
      (args.dryRun ? " (dry-run)" : "")
  );

  for (const s of selected) {
    try {
      await runSeeder(s, args);
    } catch (e) {
      console.error(`✗ ${s.key} failed: ${(e as Error).message}`);
    }
  }

  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
