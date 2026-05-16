import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type FeatRow = {
  action_cost: string | null;
  created_at: string | null;
  created_by_user_id: string | null;
  description: string;
  discord_guild_id: string | null;
  feat_metadata: unknown;
  feat_type: string | null;
  id: string;
  is_official: boolean | null;
  level: number;
  name: string;
  prerequisites: string | null;
  rarity: string | null;
  source: string | null;
  traits: unknown;
  trigger: string | null;
  updated_at: string | null;
};

type HomebrewRow = {
  id: string;
  name: string | null;
  type: string | null;
  data: Record<string, unknown> | null;
  added_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function featKey(row: FeatRow): string {
  return [
    row.is_official ? "official" : "homebrew",
    row.name.trim().toLowerCase().replace(/\s+/g, " "),
    row.level,
    row.feat_type?.trim().toLowerCase() ?? "",
  ].join("|");
}

function virtualType(row: HomebrewRow): string {
  const dataType = typeof row.data?._homebrew_type === "string" ? row.data._homebrew_type : null;
  return dataType || row.type || "item";
}

function hasStructuredJson(value: unknown): boolean {
  return Array.isArray(value) ? value.length > 0 : !!value && typeof value === "object";
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

const MATCH_ALIASES: Record<string, string[]> = {
  "half-elf": ["aiuvarin", "elf", "human"],
  aiuvarin: ["half-elf", "elf", "human"],
  "half-orc": ["dromaar", "orc", "human"],
  dromaar: ["half-orc", "orc", "human"],
};

function expectedValues(expected: string): string[] {
  const normalized = normalizeText(expected);
  return [normalized, ...(MATCH_ALIASES[normalized] ?? [])];
}

function metadataValues(metadata: unknown, key: string): string[] {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return [];

  const value = (metadata as Record<string, unknown>)[key];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") return [value];
  return [];
}

function listValues(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap((item) => listValues(item));
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value === "number" && Number.isFinite(value)) return [String(value)];
  return [];
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function sourceText(data: Record<string, unknown>): string {
  if (data.source && typeof data.source === "object") {
    const source = data.source as Record<string, unknown>;
    const sourceName = text(source.source_text) ?? text(source.book);
    const page = text(source.page);
    if (sourceName && page) return `${sourceName} pg. ${page}`;
    if (sourceName) return sourceName;
  }

  return text(data.source) ?? text(data.source_book) ?? "Homebrew";
}

function normalizeFeatType(value: unknown): string | null {
  const raw = text(value)?.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!raw) return null;
  if (raw === "class feat" || raw === "class") return "class_feat";
  if (raw === "skill feat" || raw === "skill") return "skill";
  if (raw === "ancestry feat" || raw === "ancestry") return "ancestry";
  if (raw === "general feat" || raw === "general") return "general";
  if (raw === "archetype feat" || raw === "archetype") return "archetype";
  if (raw === "heritage feat" || raw === "heritage") return "ancestry";
  if (raw === "lineage feat" || raw === "lineage") return "ancestry";
  if (raw === "bonus feat" || raw === "bonus") return "bonus";
  return raw.replace(/\s+feat$/, "").replace(/\s+/g, "_");
}

function virtualFeat(row: HomebrewRow): FeatRow {
  const data = row.data ?? {};
  const name = text(data.name) ?? text(row.name) ?? "Unnamed Feat";
  const source = sourceText(data);
  const traits = listValues(data.traits);
  const metadata =
    data.feat_metadata && typeof data.feat_metadata === "object" && !Array.isArray(data.feat_metadata)
      ? (data.feat_metadata as Record<string, unknown>)
      : {};

  return {
    action_cost: text(data.action_cost),
    created_at: row.created_at ?? null,
    created_by_user_id: row.added_by ?? null,
    description: text(data.description) ?? text(data.benefit) ?? "",
    discord_guild_id: null,
    feat_metadata: {
      ...metadata,
      homebrew_entry_id: row.id,
      classes: listValues(data.classes ?? metadata.classes),
      ancestry: listValues(data.ancestry ?? data.ancestries ?? metadata.ancestry),
      archetype: listValues(data.archetype ?? data.archetypes ?? metadata.archetype),
    },
    feat_type: normalizeFeatType(data.feat_type),
    id: row.id,
    is_official: false,
    level: numberValue(data.level, 1),
    name,
    prerequisites: text(data.prerequisites),
    rarity: text(data.rarity) ?? "Common",
    source,
    traits,
    trigger: text(data.trigger),
    updated_at: row.updated_at ?? null,
  };
}

const METADATA_KEY_ALIASES: Record<string, string[]> = {
  classes: ["classes", "class", "class_name", "class_names", "class_raw", "class_slug"],
  ancestry: ["ancestry", "ancestries", "ancestry_name", "ancestry_names", "ancestry_raw"],
  archetype: ["archetype", "archetypes", "archetype_name", "archetype_names", "archetype_raw"],
};

function metadataAliasValues(metadata: unknown, key: string): string[] {
  const keys = METADATA_KEY_ALIASES[key] ?? [key];
  return keys.flatMap((alias) => metadataValues(metadata, alias));
}

function rowMatchValues(row: FeatRow, key: string): string[] {
  const metadata = metadataAliasValues(row.feat_metadata, key);
  const traits = listValues(row.traits);

  if (key === "classes" || key === "ancestry" || key === "archetype") {
    return [...metadata, ...traits];
  }

  return metadata;
}

function featMatches(row: FeatRow, key: string, expected: string | null): boolean {
  if (!expected) return true;

  const expectedSet = new Set(expectedValues(expected));
  return rowMatchValues(row, key).some((value) => expectedSet.has(normalizeText(value)));
}

function featMatchesAny(row: FeatRow, key: string, expected: string[]): boolean {
  const expectedSet = new Set(
    expected
      .map((value) => value.trim())
      .filter(Boolean)
      .flatMap(expectedValues)
  );

  if (expectedSet.size === 0) return true;
  return rowMatchValues(row, key).some((value) => expectedSet.has(normalizeText(value)));
}

function completenessScore(row: FeatRow): number {
  const rarity = row.rarity?.toLowerCase();
  const descriptionLength = row.description?.trim().length ?? 0;

  return (
    (row.is_official ? 1000 : 0) +
    (row.source ? 250 : 0) +
    (rarity && rarity !== "common" ? 100 : 0) +
    (row.prerequisites ? 75 : 0) +
    (row.action_cost ? 50 : 0) +
    (row.trigger ? 50 : 0) +
    (hasStructuredJson(row.traits) ? 50 : 0) +
    (hasStructuredJson(row.feat_metadata) ? 50 : 0) +
    Math.min(descriptionLength, 750)
  );
}

function dedupeFeats(rows: FeatRow[]): FeatRow[] {
  const byFeat = new Map<string, FeatRow>();

  for (const row of rows) {
    const key = featKey(row);
    const existing = byFeat.get(key);

    if (!existing || completenessScore(row) > completenessScore(existing)) {
      byFeat.set(key, row);
    }
  }

  return [...byFeat.values()].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

function featMatchesRequest(
  feat: FeatRow,
  filters: {
    q: string;
    nameExact: string | null;
    featType: string | null;
    level: string | null;
    levelMin: string | null;
    levelMax: string | null;
    rarity: string | null;
    traits: string[];
    className: string | null;
    ancestryFilters: string[];
    archetype: string | null;
  }
): boolean {
  if (filters.nameExact && normalizeText(feat.name) !== normalizeText(filters.nameExact)) {
    return false;
  }
  if (!filters.nameExact && filters.q && !normalizeText(feat.name).includes(normalizeText(filters.q))) {
    return false;
  }
  if (filters.featType && feat.feat_type !== filters.featType) return false;
  if (filters.level && feat.level !== parseInt(filters.level, 10)) return false;
  if (filters.levelMin && feat.level < parseInt(filters.levelMin, 10)) return false;
  if (filters.levelMax && feat.level > parseInt(filters.levelMax, 10)) return false;
  if (filters.rarity && normalizeText(feat.rarity ?? "") !== normalizeText(filters.rarity)) {
    return false;
  }

  const traitSet = new Set(listValues(feat.traits).map(normalizeText));
  if (filters.traits.some((trait) => !traitSet.has(normalizeText(trait)))) return false;

  return (
    featMatches(feat, "classes", filters.className) &&
    featMatchesAny(feat, "ancestry", filters.ancestryFilters) &&
    featMatches(feat, "archetype", filters.archetype)
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const featType = searchParams.get("feat_type");
  const level = searchParams.get("level");
  const levelMin = searchParams.get("level_min");
  const levelMax = searchParams.get("level_max");
  const rarity = searchParams.get("rarity");
  const traits = searchParams.getAll("trait");
  const className = searchParams.get("class");
  const ancestryFilters = [...searchParams.getAll("ancestry"), ...searchParams.getAll("heritage")];
  const archetype = searchParams.get("archetype");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "25")));
  const offset = (page - 1) * limit;

  const supabase = createServiceClient();
  let query = supabase
    .from("feats")
    .select("*")
    .eq("is_official", true)
    .order("level", { ascending: true })
    .order("name", { ascending: true });

  const nameExact = searchParams.get("name");
  if (nameExact) {
    query = query.ilike("name", nameExact);
  } else if (q) {
    query = query.ilike("name", `%${q}%`);
  }
  if (featType) query = query.eq("feat_type", featType);
  if (level) query = query.eq("level", parseInt(level));
  if (levelMin) query = query.gte("level", parseInt(levelMin));
  if (levelMax) query = query.lte("level", parseInt(levelMax));
  if (rarity) query = query.eq("rarity", rarity);
  if (traits.length > 0) query = query.contains("traits", traits);

  const [{ data, error }, { data: homebrewData, error: homebrewError }] = await Promise.all([
    query,
    supabase
      .from("homebrew_entries")
      .select("*")
      .in("type", ["item", "feat"])
      .order("name", { ascending: true }),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (homebrewError) {
    return NextResponse.json({ error: homebrewError.message }, { status: 500 });
  }

  const filters = {
    q,
    nameExact,
    featType,
    level,
    levelMin,
    levelMax,
    rarity,
    traits,
    className,
    ancestryFilters,
    archetype,
  };

  const officialRows = (data ?? []) as FeatRow[];
  const homebrewRows = ((homebrewData ?? []) as HomebrewRow[])
    .filter((row) => virtualType(row) === "feat")
    .map(virtualFeat);

  const filtered = [...officialRows, ...homebrewRows].filter((feat) =>
    featMatchesRequest(feat, filters)
  );
  const deduped = dedupeFeats(filtered);
  const paged = deduped.slice(offset, offset + limit);

  return NextResponse.json({ data: paged, total: deduped.length, page, limit });
}
