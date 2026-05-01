/**
 * Generates a SQL file with UPSERT statements for all gamedata entries.
 * Use when PostgREST schema cache is stale and the REST API can't see the
 * gamedata table yet. The output SQL is applied directly via:
 *
 *   supabase db query --linked -f /tmp/gamedata_seed.sql
 *
 * Usage (from web/frontend/):
 *   npx tsx scripts/generate_gamedata_sql.ts
 *   # then from web/ directory:
 *   supabase db query --linked -f /tmp/gamedata_seed.sql
 */

import * as fs from "fs";
import * as path from "path";

const GAMEDATA_DIR = path.resolve(__dirname, "../../../Pathway/gamedata");
const OUT_DIR = "/tmp/gamedata_seed";

function load<T = unknown>(filename: string): T {
  return JSON.parse(fs.readFileSync(path.join(GAMEDATA_DIR, filename), "utf8")) as T;
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function escape(s: string): string {
  return s.replace(/'/g, "''");
}

function jsonLiteral(obj: unknown): string {
  return `'${escape(JSON.stringify(obj))}'::jsonb`;
}

interface Row { category: string; slug: string; name: string | null; data: unknown }

function fromSlugMap(category: string, file: unknown, topKey: string): Row[] {
  const map = (file as Record<string, unknown>)[topKey] as Record<string, Record<string, unknown>>;
  if (!map || typeof map !== "object" || Array.isArray(map)) return [];
  return Object.entries(map).map(([slug, entry]) => ({
    category, slug,
    name: (entry?.name as string) ?? null,
    data: entry,
  }));
}

function fromArray(category: string, file: unknown, topKey: string): Row[] {
  const arr = (file as Record<string, unknown>)[topKey] as Array<Record<string, unknown>>;
  if (!Array.isArray(arr)) return [];
  return arr
    .filter(e => e && typeof e === "object")
    .map(entry => {
      const name = (entry.name as string) ?? "";
      const slug = (entry.slug as string) || toSlug(name);
      return { category, slug, name: name || null, data: entry };
    })
    .filter(r => r.slug);
}

const FILES = [
  { category: "actions",         file: "actions.json",         topKey: "actions",         strategy: "slug_map" },
  { category: "afflictions",     file: "afflictions.json",     topKey: "afflictions",     strategy: "slug_map" },
  { category: "backgrounds",     file: "background.json",      topKey: "backgrounds",     strategy: "slug_map" },
  { category: "class_features",  file: "class-features.json",  topKey: "class_features",  strategy: "slug_map" },
  { category: "classes",         file: "classes.json",         topKey: "classes",         strategy: "slug_map" },
  { category: "companions",      file: "companions.json",      topKey: "companions",      strategy: "slug_map" },
  { category: "conditions",      file: "conditions.json",      topKey: "Conditions",      strategy: "slug_map" },
  { category: "creature_extras", file: "creature-extras.json", topKey: "creature_extras", strategy: "slug_map" },
  { category: "deities",         file: "deities.json",         topKey: "deities",         strategy: "array"    },
  { category: "domains",         file: "domains.json",         topKey: "domains",         strategy: "slug_map" },
  { category: "familiars",       file: "familiars.json",       topKey: "familiars",       strategy: "slug_map" },
  { category: "hazards",         file: "hazards.json",         topKey: "hazards",         strategy: "slug_map" },
  { category: "heritages",       file: "heritages.json",       topKey: "by_slug",         strategy: "slug_map" },
  { category: "kingdom",         file: "kingdom.json",         topKey: "kingdom",         strategy: "slug_map" },
  { category: "languages",       file: "languages.json",       topKey: "languages",       strategy: "slug_map" },
  { category: "planes",          file: "planes.json",          topKey: "planes",          strategy: "slug_map" },
  { category: "relics",          file: "relics.json",          topKey: "relics",          strategy: "slug_map" },
  { category: "rituals",         file: "rituals.json",         topKey: "rituals",         strategy: "slug_map" },
  { category: "rules",           file: "rules.json",           topKey: "Rulebook",        strategy: "slug_map" },
  { category: "siege_weapons",   file: "siege-weapons.json",   topKey: "siege_weapons",   strategy: "slug_map" },
  { category: "skills",          file: "skills.json",          topKey: "skills",          strategy: "slug_map" },
  { category: "sources",         file: "sources.json",         topKey: "sources",         strategy: "slug_map" },
  { category: "traits",          file: "traits.json",          topKey: "traits",          strategy: "slug_map" },
  { category: "vehicles",        file: "vehicles.json",        topKey: "vehicles",        strategy: "slug_map" },
] as const;

const CHUNK = 300; // rows per SQL file

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const files: string[] = [];
  let total = 0;

  for (const spec of FILES) {
    const raw = load(spec.file);
    const rows = spec.strategy === "array"
      ? fromArray(spec.category, raw, spec.topKey)
      : fromSlugMap(spec.category, raw, spec.topKey);

    if (rows.length === 0) {
      console.log(`  — ${spec.category}: 0 rows`);
      continue;
    }

    // Split into chunks so each file stays under the API size limit
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      const part = Math.floor(i / CHUNK) + 1;
      const outFile = path.join(OUT_DIR, `${spec.category}_${String(part).padStart(3, "0")}.sql`);

      const lines: string[] = [
        `-- ${spec.category} part ${part} (rows ${i + 1}–${i + chunk.length})`,
      ];
      for (const row of chunk) {
        const nameLit = row.name ? `'${escape(row.name)}'` : "NULL";
        lines.push(
          `INSERT INTO public.gamedata (category, slug, name, data) VALUES ` +
          `('${spec.category}', '${escape(row.slug)}', ${nameLit}, ${jsonLiteral(row.data)}) ` +
          `ON CONFLICT (category, slug) DO UPDATE SET name = EXCLUDED.name, data = EXCLUDED.data, updated_at = now();`
        );
      }

      fs.writeFileSync(outFile, lines.join("\n"), "utf8");
      files.push(outFile);
    }

    console.log(`  ✓ ${spec.category}: ${rows.length} rows`);
    total += rows.length;
  }

  console.log(`\nWrote ${total} rows across ${files.length} files in ${OUT_DIR}`);
  console.log("\nApply all (from web/ directory):");
  console.log(`  for f in ${OUT_DIR}/*.sql; do supabase db query --linked -f "$f" && echo "✓ $f"; done`);
}

main();
