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
 *   npx tsx scripts/seed_nethys.ts --only=feats,spells,heritages
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
  transformHeritage,
  transformBackground,
  transformClass,
  transformClassFeature,
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
    else if (a.startsWith("--only="))
      out.only = a.slice("--only=".length).split(",").filter(Boolean);
    else if (a.startsWith("--limit=")) out.limit = parseInt(a.slice("--limit=".length), 10);
  }
  return out;
}

// ── row/write helpers ─────────────────────────────────────────

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function rowKey(row: Record<string, unknown>, fields: string[]): string {
  return fields.map((field) => String(row[field] ?? "")).join("\u0001");
}

function metadataFor(row: Record<string, unknown>): Record<string, unknown> {
  for (const value of Object.values(row)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const maybe = value as Record<string, unknown>;
      if ("remaster_id" in maybe || "primary_source" in maybe || "summary" in maybe) return maybe;
    }
  }
  return {};
}

function isLegacyRemaster(row: Record<string, unknown>): boolean {
  const remasterId = metadataFor(row).remaster_id;
  return Array.isArray(remasterId) ? remasterId.length > 0 : Boolean(remasterId);
}

function preferredRow(
  current: Record<string, unknown>,
  next: Record<string, unknown>
): Record<string, unknown> {
  if (isLegacyRemaster(current) && !isLegacyRemaster(next)) return next;
  if (!isLegacyRemaster(current) && isLegacyRemaster(next)) return current;
  return next;
}

function dedupeRows(rows: Record<string, unknown>[], fields?: string[]): Record<string, unknown>[] {
  if (!fields?.length) return rows;
  const byKey = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    const key = rowKey(row, fields);
    if (!key.replace(/\u0001/g, "")) continue;
    const existing = byKey.get(key);
    byKey.set(key, existing ? preferredRow(existing, row) : row);
  }
  return Array.from(byKey.values());
}

async function adoptExistingRows(
  table: string,
  rows: Record<string, unknown>[],
  fields: string[] | undefined,
  replaceExisting: boolean | undefined
): Promise<Record<string, unknown>[]> {
  if (!fields?.length || rows.length === 0) return rows;

  const firstField = fields[0];
  const firstValues = Array.from(
    new Set(
      rows
        .map((row) => row[firstField])
        .filter(
          (value): value is string | number =>
            typeof value === "string" || typeof value === "number"
        )
    )
  );
  if (firstValues.length === 0) return rows;

  const selectColumns = Array.from(new Set(["id", "aon_id", ...fields])).join(",");
  const existingByKey = new Map<string, Record<string, unknown>[]>();

  for (const values of chunk(firstValues, BATCH)) {
    const { data, error } = await db.from(table).select(selectColumns).in(firstField, values);
    if (error) throw error;
    for (const existing of data ?? []) {
      const existingRow = existing as unknown as Record<string, unknown>;
      const key = rowKey(existingRow, fields);
      const bucket = existingByKey.get(key) ?? [];
      bucket.push(existingRow);
      existingByKey.set(key, bucket);
    }
  }

  const remaining: Record<string, unknown>[] = [];
  let adopted = 0;

  for (const row of rows) {
    const matches = existingByKey.get(rowKey(row, fields)) ?? [];
    const adoptable = matches.filter((match) => replaceExisting || !match.aon_id);
    if (adoptable.length !== 1) {
      remaining.push(row);
      continue;
    }

    const { error } = await db.from(table).update(row).eq("id", adoptable[0].id);
    if (error) throw error;
    adopted++;
  }

  if (adopted > 0) {
    console.log(`  ↻ ${table}: adopted ${adopted} existing row(s) by ${fields.join("+")}`);
  }
  return remaining;
}

async function writeRows(
  table: string,
  rows: Record<string, unknown>[],
  opts: {
    conflict: string;
    dryRun: boolean;
    dedupeBy?: string[];
    adoptExistingBy?: string[];
    replaceExisting?: boolean;
  }
): Promise<void> {
  rows = dedupeRows(rows, opts.dedupeBy);
  if (rows.length === 0) return;
  if (opts.dryRun) {
    console.log(`  (dry-run) would upsert ${rows.length} into ${table} on ${opts.conflict}`);
    return;
  }

  rows = await adoptExistingRows(table, rows, opts.adoptExistingBy, opts.replaceExisting);
  for (const [index, slice] of chunk(rows, BATCH).entries()) {
    const { error } = await db.from(table).upsert(slice, { onConflict: opts.conflict });
    if (error) {
      console.error(`  ✗ ${table} batch ${index}: ${error.message}`);
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
  dedupeBy?: string[];
  adoptExistingBy?: string[];
  replaceExisting?: boolean;
};

const SEEDERS: Seeder[] = [
  {
    key: "ancestries",
    category: "ancestry",
    table: "ancestries",
    conflict: "aon_id",
    transform: transformAncestry,
    dedupeBy: ["name"],
    adoptExistingBy: ["name"],
    replaceExisting: true,
  },
  {
    key: "classes",
    category: "class",
    table: "character_classes",
    conflict: "aon_id",
    transform: transformClass,
    dedupeBy: ["name"],
    adoptExistingBy: ["name"],
    replaceExisting: true,
  },
  {
    key: "backgrounds",
    category: "background",
    table: "backgrounds",
    conflict: "aon_id",
    transform: transformBackground,
    dedupeBy: ["name"],
    adoptExistingBy: ["name"],
    replaceExisting: true,
  },
  {
    key: "archetypes",
    category: "archetype",
    table: "archetypes",
    conflict: "aon_id",
    transform: transformArchetype,
    dedupeBy: ["name"],
    adoptExistingBy: ["name"],
    replaceExisting: true,
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
    dedupeBy: ["name"],
    adoptExistingBy: ["name"],
    replaceExisting: true,
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

  await writeRows(seeder.table, rows, {
    conflict: seeder.conflict,
    dryRun: args.dryRun,
    dedupeBy: seeder.dedupeBy,
    adoptExistingBy: seeder.adoptExistingBy,
    replaceExisting: seeder.replaceExisting,
  });
}

// ── relationship-backed seeders ───────────────────────────────

type NamedRef = { id: string; name: string };

function lower(value: unknown): string {
  return String(value ?? "").toLowerCase();
}

async function loadRefs(table: string): Promise<NamedRef[]> {
  const { data, error } = await db.from(table).select("id,name").eq("is_official", true);
  if (error) throw error;
  return (data ?? []) as NamedRef[];
}

function inferAncestryName(heritageName: string, ancestries: string[]): string | null {
  const normalized = heritageName.toLowerCase();
  const matches = ancestries
    .filter(
      (name) => normalized === name.toLowerCase() || normalized.endsWith(` ${name.toLowerCase()}`)
    )
    .sort((a, b) => b.length - a.length);
  return matches[0] ?? null;
}

async function runHeritageSeeder(args: Args): Promise<void> {
  console.log("\n→ heritages (heritage)");
  const docs = await fetchCategory("heritage", {
    refresh: args.refresh,
    limit: args.limit ?? undefined,
  });
  console.log(`  fetched ${docs.length} docs`);

  if (args.dryRun) {
    const ancestryDocs = await fetchCategory("ancestry", { refresh: false });
    const ancestryNames = ancestryDocs.map((doc) => String(doc._source.name ?? "")).filter(Boolean);
    const inferred = docs.filter((doc) =>
      inferAncestryName(String(doc._source.name ?? ""), ancestryNames)
    ).length;
    console.log(`  (dry-run) would infer ${inferred}/${docs.length} ancestry-specific heritages`);
    console.log(`  (dry-run) would upsert ${docs.length} into heritages on aon_id`);
    return;
  }

  const ancestryRefs = await loadRefs("ancestries");
  const ancestryByName = new Map(ancestryRefs.map((ref) => [lower(ref.name), ref.id]));
  const fallbackAncestryId = ancestryByName.get("human") ?? ancestryRefs[0]?.id;
  if (!fallbackAncestryId) {
    throw new Error("No ancestries found in Supabase. Run --only=ancestries before heritages.");
  }

  const ancestryNames = ancestryRefs.map((ref) => ref.name);
  const rows: Record<string, unknown>[] = [];
  let versatile = 0;
  let skipped = 0;

  for (const doc of docs) {
    const row = transformHeritage(doc);
    if (!row.name) {
      skipped++;
      continue;
    }
    const inferred = inferAncestryName(String(row.name), ancestryNames);
    const ancestryId = inferred ? ancestryByName.get(lower(inferred)) : fallbackAncestryId;
    if (!ancestryId) {
      skipped++;
      continue;
    }
    if (!inferred) versatile++;
    rows.push({ ...row, ancestry_id: ancestryId, is_versatile: !inferred });
  }

  if (skipped > 0) console.log(`  skipped ${skipped} heritage(s) without a resolvable ancestry`);
  console.log(`  versatile/fallback heritages: ${versatile}`);
  await writeRows("heritages", rows, {
    conflict: "aon_id",
    dryRun: false,
    dedupeBy: ["aon_id"],
  });
}

async function runClassFeatureSeeder(args: Args): Promise<void> {
  console.log("\n→ class_features (class-feature)");
  const docs = await fetchCategory("class-feature", {
    refresh: args.refresh,
    limit: args.limit ?? undefined,
  });
  console.log(`  fetched ${docs.length} docs`);

  if (args.dryRun) {
    const withClass = docs.filter((doc) => Boolean(doc._source.class)).length;
    console.log(`  (dry-run) would resolve ${withClass}/${docs.length} class feature owner(s)`);
    console.log(`  (dry-run) would upsert ${withClass} into class_features on aon_id`);
    return;
  }

  const classRefs = await loadRefs("character_classes");
  const classByName = new Map(classRefs.map((ref) => [lower(ref.name), ref.id]));
  if (classByName.size === 0) {
    throw new Error(
      "No character_classes found in Supabase. Run --only=classes before class_features."
    );
  }

  const rows: Record<string, unknown>[] = [];
  let skipped = 0;
  for (const doc of docs) {
    const row = transformClassFeature(doc);
    const meta = row.class_feature_metadata as Record<string, unknown>;
    const className = String(meta?.class_name ?? "");
    const classId = classByName.get(lower(className));
    if (!row.name || !classId) {
      skipped++;
      continue;
    }
    rows.push({ ...row, character_class_id: classId });
  }

  if (skipped > 0) console.log(`  skipped ${skipped} feature(s) without a matching class`);
  await writeRows("class_features", rows, {
    conflict: "aon_id",
    dryRun: false,
    dedupeBy: ["aon_id"],
  });
}

const CUSTOM_SEEDERS = new Set(["heritages", "class_features"]);
const ALL_KEYS = new Set([...SEEDERS.map((s) => s.key), ...CUSTOM_SEEDERS]);

// ── main ──────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const unknown = args.only?.filter((key) => !ALL_KEYS.has(key)) ?? [];
  if (unknown.length > 0) {
    console.error(`Unknown --only value: ${unknown.join(", ")}`);
    console.error(`Choices: ${Array.from(ALL_KEYS).join(", ")}`);
    process.exit(1);
  }

  const selected = args.only ? SEEDERS.filter((s) => args.only!.includes(s.key)) : SEEDERS;
  const selectedCustom = Array.from(CUSTOM_SEEDERS).filter(
    (key) => !args.only || args.only.includes(key)
  );
  const selectedNames = [...selected.map((s) => s.key), ...selectedCustom];

  console.log(
    `Nethys seed: ${selectedNames.join(", ")}` +
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

  if (selectedCustom.includes("heritages")) {
    try {
      await runHeritageSeeder(args);
    } catch (e) {
      console.error(`✗ heritages failed: ${(e as Error).message}`);
    }
  }

  if (selectedCustom.includes("class_features")) {
    try {
      await runClassFeatureSeeder(args);
    } catch (e) {
      console.error(`✗ class_features failed: ${(e as Error).message}`);
    }
  }

  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
