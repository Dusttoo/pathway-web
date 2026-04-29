/**
 * PF2e content seeder — populates Supabase tables from Pathway JSON data files.
 *
 * Usage (from web/frontend/):
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx ../scripts/seed_pf2e_supabase.ts
 *
 * Or load from .env.local first:
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx ../scripts/seed_pf2e_supabase.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const DATA_DIR = path.resolve(__dirname, "../../../Pathway/data");
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
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), "utf8")) as T;
}

function csv(s: unknown): string[] {
  if (!s || typeof s !== "string") return [];
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

function ordinalToInt(raw: unknown): number {
  if (typeof raw === "number") return raw;
  if (typeof raw !== "string") return 0;
  const map: Record<string, number> = {
    "1st": 1, "2nd": 2, "3rd": 3, "4th": 4, "5th": 5,
    "6th": 6, "7th": 7, "8th": 8, "9th": 9, "10th": 10,
  };
  return map[raw.trim()] ?? 0;
}

function toSpeed(raw: unknown): number {
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const m = raw.match(/(\d+)/);
    return m ? parseInt(m[1]) : 25;
  }
  return 25;
}

function inferFeatType(traits: string[]): string {
  const t = traits.map((x) => x.toLowerCase());
  if (t.includes("ancestry")) return "ancestry";
  if (t.includes("class")) return "class_feat";
  if (t.includes("archetype")) return "archetype";
  if (t.includes("skill")) return "skill";
  return "general";
}

async function alreadySeeded(table: string): Promise<boolean> {
  const { count } = await db.from(table).select("*", { count: "exact", head: true });
  return (count ?? 0) > 0;
}

async function insertBatches(
  table: string,
  rows: Record<string, unknown>[],
  onConflict?: string
) {
  let total = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const query = onConflict
      ? db.from(table).upsert(chunk, { onConflict })
      : db.from(table).insert(chunk);
    const { error } = await query;
    if (error) {
      console.error(`  ✗ ${table} [${i}–${i + chunk.length}]: ${error.message}`);
    } else {
      total += chunk.length;
    }
  }
  console.log(`  ✓ ${table}: ${total}/${rows.length} rows`);
}

// ---------------------------------------------------------------------------
// Seeders
// ---------------------------------------------------------------------------

async function seedSkills() {
  if (await alreadySeeded("skills")) return console.log("  — skills: already seeded, skipping");
  const data = load<Record<string, Record<string, unknown>>>("skills.json");
  const skills = data.skills as Record<string, Record<string, unknown>>;
  const rows = Object.entries(skills).map(([key, s], idx) => ({
    name: String(s.name ?? key),
    key,
    ability: String(s.keyAttribute ?? "").toLowerCase(),
    description: String(s.description ?? ""),
    sort_order: idx,
  }));
  await insertBatches("skills", rows, "key");
}

async function seedAncestries() {
  if (await alreadySeeded("ancestries")) return console.log("  — ancestries: already seeded, skipping");
  const data = load<Record<string, Record<string, unknown>>>("ancestries.json");

  const ancestryRows = Object.entries(data).map(([key, a]) => ({
    name: String(a.name ?? key),
    description: String(a.description ?? ""),
    ancestry_hp: typeof a.hp === "number" ? a.hp : 8,
    size: String(a.size ?? "Medium"),
    speed: toSpeed(a.speed),
    attribute_boosts: Array.isArray(a.attribute_boosts) ? a.attribute_boosts : [],
    attribute_flaws: Array.isArray(a.attribute_flaws) ? a.attribute_flaws : [],
    languages: Array.isArray(a.languages) ? a.languages : [],
    bonus_languages: 0,
    traits: Array.isArray(a.traits) ? a.traits : [],
    senses: a.senses ?? {},
    special_abilities: Array.isArray(a.special) ? a.special : [],
    rarity: "Common",
    source: String(a.source ?? ""),
    is_official: true,
  }));

  await insertBatches("ancestries", ancestryRows);

  // Fetch inserted IDs, then insert heritages
  const { data: inserted } = await db.from("ancestries").select("id, name");
  const idByName = Object.fromEntries((inserted ?? []).map((r) => [r.name, r.id]));

  const heritageRows: Record<string, unknown>[] = [];
  for (const [key, a] of Object.entries(data)) {
    const ancestryName = String(a.name ?? key);
    const ancestryId = idByName[ancestryName];
    if (!ancestryId) continue;
    for (const h of (a.heritages as Array<Record<string, unknown>>) ?? []) {
      heritageRows.push({
        ancestry_id: ancestryId,
        name: String(h.name ?? ""),
        description: String(h.description ?? ""),
        traits: [],
        benefits: {},
        is_versatile: false,
        is_official: true,
        source: String(a.source ?? ""),
      });
    }
  }
  await insertBatches("heritages", heritageRows);
}

async function seedBackgrounds() {
  if (await alreadySeeded("backgrounds")) return console.log("  — backgrounds: already seeded, skipping");
  const data = load<Record<string, unknown>>("background.json");
  const bgs = data.backgrounds as Record<string, Record<string, unknown>>;
  const rowMap = new Map<string, Record<string, unknown>>();
  for (const b of Object.values(bgs)) {
    const name = String(b.name ?? "");
    if (!name) continue;
    rowMap.set(name, {
      name,
      description: String(b.summary ?? ""),
      attribute_boosts: Array.isArray(b.ability_boosts) ? b.ability_boosts : [],
      skill_proficiencies: Array.isArray(b.trained_skills) ? b.trained_skills : [],
      lore_skills: [],
      rarity: String(b.rarity ?? "Common"),
      source: String(b.source ?? ""),
      is_official: true,
      background_metadata: {},
    });
  }
  const rows = Array.from(rowMap.values());
  // backgrounds has UNIQUE(name)
  await insertBatches("backgrounds", rows, "name");
}

async function seedClasses() {
  if (await alreadySeeded("character_classes")) return console.log("  — character_classes: already seeded, skipping");
  const data = load<Record<string, unknown>>("classes.json");
  const classes = data.classes as Record<string, Record<string, unknown>>;
  const rows = Object.values(classes).map((c) => ({
    name: String(c.name ?? ""),
    description: String(c.description ?? ""),
    class_hp: typeof c.hitPoints === "number" ? c.hitPoints : 8,
    key_attribute: Array.isArray(c.keyAttribute) ? c.keyAttribute : (c.keyAttribute ? [c.keyAttribute] : []),
    initial_proficiencies: (c.proficiencies as object) ?? {},
    class_features: Array.isArray(c.classFeatures) ? c.classFeatures : [],
    is_spellcaster: Boolean(
      (c.classFeatures as string[] | undefined)?.some?.(
        (f) => typeof f === "string" && f.toLowerCase().includes("spellcast")
      )
    ),
    source: String(c.source ?? ""),
    is_official: true,
    class_metadata: { keyFeatures: c.keyFeatures ?? [] },
  }));
  // character_classes has UNIQUE(name)
  await insertBatches("character_classes", rows, "name");
}

async function seedArchetypes() {
  if (await alreadySeeded("archetypes")) return console.log("  — archetypes: already seeded, skipping");
  const data = load<Record<string, Record<string, unknown>>>("archetypes.json");
  const rows = Object.values(data).map((a) => ({
    name: String(a.name ?? ""),
    description: String(a.description ?? ""),
    archetype_type: String(a.type ?? "multiclass").toLowerCase().replace(/ /g, "_"),
    traits: [],
    rarity: String(a.rarity ?? "Common"),
    source: String(a.source ?? ""),
    is_official: true,
  }));
  await insertBatches("archetypes", rows);
}

async function seedFeats() {
  if (await alreadySeeded("feats")) return console.log("  — feats: already seeded, skipping");
  const data = load<Record<string, unknown>>("feats.json");
  const feats = (data.feats ?? []) as Array<Record<string, unknown>>;
  const rows = feats.map((f) => {
    const traits = Array.isArray(f.traits) ? f.traits.map(String) : csv(f.traits);
    return {
      name: String(f.name ?? ""),
      description: String(f.description ?? ""),
      feat_type: inferFeatType(traits),
      level: typeof f.level === "number" ? f.level : 1,
      traits,
      prerequisites: f.prerequisites ? String(f.prerequisites) : null,
      rarity: String(f.rarity ?? "Common"),
      source: String(f.source ?? ""),
      is_official: true,
      feat_metadata: {},
    };
  });
  await insertBatches("feats", rows);
}

async function seedSpells() {
  if (await alreadySeeded("spells")) return console.log("  — spells: already seeded, skipping");
  const spells = load<Array<Record<string, unknown>>>("spells.json");
  const rows = spells.map((s) => {
    const spellType = String(s.type ?? "").toLowerCase();
    return {
      name: String(s.name ?? ""),
      level: ordinalToInt(s.level),
      traditions: csv(s.traditions).map((t) => t.toLowerCase()),
      traits: csv(s.traits),
      cast_actions: s.cast ? String(s.cast) : null,
      defense: s.defense ? String(s.defense) : null,
      area: s.area ? String(s.area) : null,
      range_text: s.range ? String(s.range) : "",
      duration: s.duration ? String(s.duration) : "",
      description: String(s.description ?? s.summary ?? ""),
      is_focus_spell: spellType === "focus",
      is_ritual: spellType === "ritual",
      heightening: s.heightened ? { raw: String(s.heightened) } : null,
      classes: [],
      rarity: String(s.rarity ?? "Common"),
      source: String(s.source ?? ""),
      is_official: true,
      spell_metadata: {},
    };
  });
  await insertBatches("spells", rows);
}

async function seedItems() {
  if (await alreadySeeded("items")) return console.log("  — items: already seeded, skipping");
  const data = load<Record<string, unknown>>("items.json");
  const items = data.items as Record<string, Record<string, unknown>>;
  const rows = Object.values(items).map((item) => ({
    name: String(item.name ?? ""),
    item_type: String(item.category ?? "adventuring_gear").toLowerCase().replace(/ /g, "_"),
    item_subtype: item.subcategory ? String(item.subcategory) : null,
    level: typeof item.level === "number" ? item.level : 0,
    price_cp: typeof item.price_cp === "number" ? item.price_cp : 0,
    bulk: item.bulk_normalized ? String(item.bulk_normalized) : null,
    traits: Array.isArray(item.traits) ? item.traits : csv(item.traits as string),
    rarity: String(item.rarity ?? "Common"),
    description: "",
    is_magical: false,
    usage: item.usage ? String(item.usage) : null,
    source: String(item.source ?? ""),
    is_official: true,
    item_metadata: {},
  }));
  await insertBatches("items", rows);
}

async function seedBestiary() {
  if (await alreadySeeded("monsters")) return console.log("  — monsters: already seeded, skipping");
  const data = load<Record<string, unknown>>("bestiary.json");
  const creatures = data.creatures as Record<string, Record<string, unknown>>;

  const toMonsterRow = (m: Record<string, unknown>, isCompanion: boolean) => {
    const saves = (m.saves ?? (m.defenses as Record<string, unknown> | null)) as Record<string, number> | null;
    const speedRaw = m.speed;
    const speedObj =
      typeof speedRaw === "number" ? { walk: speedRaw } :
      typeof speedRaw === "string" ? { walk: toSpeed(speedRaw) } :
      (speedRaw as object) ?? {};

    return {
      name: String(m.name ?? ""),
      level: typeof m.level === "number" ? m.level : 0,
      size: String(m.size ?? "Medium"),
      creature_type: String(
        (m.creature_traits as string[] | undefined)?.[0] ??
        (m.traits as string[] | undefined)?.[0] ?? "Humanoid"
      ),
      alignment: String(m.alignment ?? "Unaligned"),
      traits: Array.isArray(m.creature_traits ?? m.traits) ? (m.creature_traits ?? m.traits) : [],
      rarity: String(m.rarity ?? "Common"),
      hp: typeof m.hp === "number" ? m.hp : 0,
      ac: typeof m.ac === "number" ? m.ac : 10,
      perception: typeof m.perception === "number" ? m.perception : 0,
      saving_throws: saves
        ? { fort: saves.fort ?? saves.fortitude ?? 0, ref: saves.ref ?? saves.reflex ?? 0, will: saves.will ?? 0 }
        : {},
      speed: speedObj,
      ability_modifiers: (m.ability_modifiers as object) ?? {},
      languages: Array.isArray(m.languages) ? m.languages : [],
      immunities: Array.isArray(m.immunities) ? m.immunities : [],
      resistances: Array.isArray(m.resistances) ? m.resistances : [],
      weaknesses: Array.isArray(m.weaknesses) ? m.weaknesses : [],
      abilities: Array.isArray(m.abilities) ? m.abilities : [],
      attacks: Array.isArray(m.attacks) ? m.attacks : [],
      spellcasting: m.spellcasting ?? null,
      is_companion: isCompanion,
      companion_types: [],
      description: String(m.lore_short ?? m.description ?? ""),
      source: m.source
        ? String(typeof m.source === "object" ? JSON.stringify(m.source) : m.source)
        : null,
      is_official: true,
      monster_metadata: {},
    };
  };

  const bestiaryRows = Object.values(creatures).map((c) => {
    const core = (c.core ?? {}) as Record<string, unknown>;
    const rich = (c.rich ?? {}) as Record<string, unknown>;
    return toMonsterRow({ ...core, ...rich }, false);
  });
  await insertBatches("monsters", bestiaryRows);

  // Companions
  const compData = load<Record<string, unknown>>("companions.json");
  const companions = compData.companions as Record<string, Record<string, unknown>>;
  const companionRows = Object.values(companions).map((c) => toMonsterRow(c, true));
  await insertBatches("monsters", companionRows);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== PF2e Supabase Seeder ===\n");

  await seedSkills();
  await seedAncestries();
  await seedBackgrounds();
  await seedClasses();
  await seedArchetypes();
  await seedFeats();
  await seedSpells();
  await seedItems();
  await seedBestiary();

  console.log("\n✓ Seeding complete!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
