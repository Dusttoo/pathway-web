import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

type SearchKind =
  | "ancestry"
  | "background"
  | "class"
  | "feat"
  | "spell"
  | "monster"
  | "item"
  | "reference";

export type GlobalSearchResult = {
  id: string;
  kind: SearchKind;
  category: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  aonUrl: string | null;
  isOfficial: boolean | null;
  rank: number;
};

type QueryResult = {
  data?: unknown[] | null;
  error?: { message: string } | null;
};

type UntypedQuery = PromiseLike<QueryResult> & {
  select: (columns: string) => UntypedQuery;
  ilike: (column: string, pattern: string) => UntypedQuery;
  eq: (column: string, value: unknown) => UntypedQuery;
  order: (column: string, options?: { ascending?: boolean }) => UntypedQuery;
  limit: (count: number) => UntypedQuery;
};

type UntypedClient = {
  from: (table: string) => UntypedQuery;
};

type Row = Record<string, unknown>;

const DIRECT_SEARCHES = [
  {
    table: "ancestries",
    kind: "ancestry",
    category: "Ancestries",
    href: (row: Row) => `/library/ancestries/${str(row.id)}`,
    select: "id, name, description, rarity, source, is_official, ancestry_metadata",
    metadata: "ancestry_metadata",
  },
  {
    table: "backgrounds",
    kind: "background",
    category: "Backgrounds",
    href: (row: Row) => `/library/backgrounds/${str(row.id)}`,
    select: "id, name, description, rarity, source, is_official, background_metadata",
    metadata: "background_metadata",
  },
  {
    table: "character_classes",
    kind: "class",
    category: "Classes",
    href: (row: Row) => `/library/classes/${str(row.id)}`,
    select: "id, name, description, class_hp, is_spellcaster, is_official, class_metadata",
    metadata: "class_metadata",
    subtitle: (row: Row) =>
      `${num(row.class_hp)} HP${bool(row.is_spellcaster) ? " spellcaster" : " martial"}`,
  },
  {
    table: "feats",
    kind: "feat",
    category: "Feats",
    href: (row: Row) => `/library/feats/${str(row.id)}`,
    select: "id, name, description, level, feat_type, rarity, source, is_official, feat_metadata",
    metadata: "feat_metadata",
    subtitle: (row: Row) =>
      ["Level " + num(row.level), str(row.feat_type).replace(/_/g, " "), str(row.rarity)]
        .filter(Boolean)
        .join(" · "),
  },
  {
    table: "spells",
    kind: "spell",
    category: "Spells",
    href: (row: Row) => `/library/spells/${str(row.id)}`,
    select:
      "id, name, description, level, rarity, traditions, is_focus_spell, is_ritual, is_official, spell_metadata",
    metadata: "spell_metadata",
    subtitle: (row: Row) =>
      [
        "Level " + num(row.level),
        bool(row.is_focus_spell) ? "focus" : "",
        bool(row.is_ritual) ? "ritual" : "",
        list(row.traditions).join(", "),
      ]
        .filter(Boolean)
        .join(" · "),
  },
  {
    table: "monsters",
    kind: "monster",
    category: "Monsters",
    href: (row: Row) => `/library/monsters/${str(row.id)}`,
    select: "id, name, description, level, rarity, creature_type, is_official, monster_metadata",
    metadata: "monster_metadata",
    subtitle: (row: Row) =>
      ["Level " + str(row.level || "?"), str(row.creature_type), str(row.rarity)]
        .filter(Boolean)
        .join(" · "),
  },
  {
    table: "items",
    kind: "item",
    category: "Items",
    href: (row: Row) => `/library/items/${str(row.id)}`,
    select: "id, name, description, level, rarity, item_type, bulk, is_official, item_metadata",
    metadata: "item_metadata",
    subtitle: (row: Row) =>
      ["Level " + num(row.level), str(row.item_type).replace(/_/g, " "), str(row.rarity)]
        .filter(Boolean)
        .join(" · "),
  },
] as const;

export function normalizeSearchQuery(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 80);
}

export async function searchRulesLibrary(
  service: SupabaseClient<Database>,
  input: { q: string; limit?: number }
) {
  const q = normalizeSearchQuery(input.q);
  const limit = Math.min(50, Math.max(1, input.limit ?? 24));

  if (q.length < 2) {
    return { results: [], total: 0, query: q };
  }

  const db = service as unknown as UntypedClient;
  const perSourceLimit = Math.max(8, Math.ceil(limit / 2));
  const pattern = `%${escapeLike(q)}%`;

  const directPromises = DIRECT_SEARCHES.map(async (config) => {
    const { data, error } = await db
      .from(config.table)
      .select(config.select)
      .ilike("name", pattern)
      .limit(perSourceLimit);

    if (error) throw new Error(error.message);

    return ((data ?? []) as Row[]).map((row) =>
      buildDirectResult(row, config, q)
    );
  });

  const gamedataPromise = db
    .from("gamedata")
    .select("id, category, slug, name, data, updated_at")
    .ilike("name", pattern)
    .order("name", { ascending: true })
    .limit(perSourceLimit * 2)
    .then(({ data, error }) => {
      if (error) throw new Error(error.message);
      return ((data ?? []) as Row[]).map((row) => buildGamedataResult(row, q));
    });

  const resultGroups = await Promise.all([...directPromises, gamedataPromise]);
  const results = resultGroups
    .flat()
    .sort((a, b) => b.rank - a.rank || a.title.localeCompare(b.title))
    .slice(0, limit);

  return { results, total: results.length, query: q };
}

function buildDirectResult(
  row: Row,
  config: (typeof DIRECT_SEARCHES)[number],
  query: string
): GlobalSearchResult {
  const metadata = dataObject(row[config.metadata]);
  const title = str(row.name);

  return {
    id: str(row.id),
    kind: config.kind,
    category: config.category,
    title,
    subtitle:
      "subtitle" in config && typeof config.subtitle === "function"
        ? config.subtitle(row)
        : [str(row.rarity), str(row.source)].filter(Boolean).join(" · "),
    description: cleanContentText(row.description || metadata.description || metadata.text),
    href: config.href(row),
    aonUrl: str(metadata.aon_url || row.aon_url) || null,
    isOfficial: typeof row.is_official === "boolean" ? row.is_official : null,
    rank: score(title, query) + score(str(row.description), query) * 0.25,
  };
}

function buildGamedataResult(row: Row, query: string): GlobalSearchResult {
  const data = dataObject(row.data);
  const category = str(row.category);
  const title = str(row.name || row.slug);

  return {
    id: str(row.id || `${category}:${row.slug}`),
    kind: "reference",
    category: titleCase(category.replace(/_/g, " ")),
    title,
    subtitle: [str(data.rarity), str(data.source), data.level != null ? `Level ${data.level}` : ""]
      .filter(Boolean)
      .join(" · "),
    description: cleanContentText(
      data.description || data.text || data.summary || data.summary_markdown || data.markdown
    ),
    href: `/library/reference/${category}/${str(row.slug)}`,
    aonUrl: str(data.aon_url || data.url) || null,
    isOfficial: data.is_official == null ? null : Boolean(data.is_official),
    rank: score(title, query) + score(JSON.stringify(data), query) * 0.1,
  };
}

function escapeLike(value: string) {
  return value.replace(/[%_]/g, (char) => `\\${char}`);
}

function score(value: string, query: string) {
  const haystack = value.toLowerCase();
  const needle = query.toLowerCase();
  if (!haystack || !needle) return 0;
  if (haystack === needle) return 1000;
  if (haystack.startsWith(needle)) return 700;
  if (haystack.includes(needle)) return 300;
  return 0;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function num(value: unknown): number {
  return typeof value === "number" ? value : Number(value) || 0;
}

function bool(value: unknown): boolean {
  return Boolean(value);
}

function list(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function dataObject(value: unknown): Row {
  if (typeof value === "string" && value.trim().startsWith("{")) {
    try {
      return dataObject(JSON.parse(value));
    } catch {
      return {};
    }
  }
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Row) : {};
}

function cleanContentText(value: unknown): string {
  if (value == null) return "";
  if (typeof value !== "string") return cleanContentText(dataObject(value).description);

  return value
    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, " ")
    .replace(/<traits>[\s\S]*?<\/traits>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 260);
}

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
