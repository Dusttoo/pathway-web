import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Valid category values — acts as an allowlist so callers can't enumerate
// arbitrary table contents.
const VALID_CATEGORIES = new Set([
  "actions",
  "afflictions",
  "backgrounds",
  "class_features",
  "classes",
  "companions",
  "conditions",
  "creature_extras",
  "deities",
  "domains",
  "familiars",
  "hazards",
  "heritages",
  "kingdom",
  "languages",
  "planes",
  "relics",
  "rituals",
  "rules",
  "siege_weapons",
  "skills",
  "sources",
  "traits",
  "vehicles",
]);

type GamedataRow = {
  category?: string;
  data: unknown;
  name: string | null;
  slug: string;
  updated_at: string | null;
};

function normalizedName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function dataObject(data: unknown): Record<string, unknown> {
  return data && typeof data === "object" && !Array.isArray(data)
    ? (data as Record<string, unknown>)
    : {};
}

function textLength(value: unknown): number {
  return typeof value === "string" ? value.trim().length : 0;
}

function completenessScore(row: GamedataRow): number {
  const obj = dataObject(row.data);

  return (
    (row.updated_at ? 100 : 0) +
    (textLength(obj.source) ? 100 : 0) +
    (textLength(obj.description) ? 75 : 0) +
    (textLength(obj.text) ? 75 : 0) +
    (textLength(obj.summary) ? 50 : 0) +
    Object.keys(obj).length * 10 +
    Math.min(JSON.stringify(row.data ?? {}).length, 1000)
  );
}

function dedupeGamedata(rows: GamedataRow[]): GamedataRow[] {
  const byEntry = new Map<string, GamedataRow>();

  for (const row of rows) {
    const key = normalizedName(row.name || row.slug);
    const existing = byEntry.get(key);

    if (!existing || completenessScore(row) > completenessScore(existing)) {
      byEntry.set(key, row);
    }
  }

  return [...byEntry.values()].sort((a, b) => (a.name || a.slug).localeCompare(b.name || b.slug));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const category = searchParams.get("category") ?? "";
  const slug = searchParams.get("slug") ?? "";
  const q = searchParams.get("q") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "25")));
  const offset = (page - 1) * limit;

  if (!category) {
    return NextResponse.json({ error: "category param required" }, { status: 400 });
  }
  if (!VALID_CATEGORIES.has(category)) {
    return NextResponse.json({ error: `unknown category: ${category}` }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Single-entry lookup by slug — returns the full data object.
  if (slug) {
    const { data, error } = await supabase
      .from("gamedata")
      .select("slug, name, data, updated_at")
      .eq("category", category)
      .eq("slug", slug)
      .single();

    if (error) {
      const status = error.code === "PGRST116" ? 404 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ data });
  }

  // Browse / search — paginated list with optional name filter.
  let query = supabase
    .from("gamedata")
    .select("category, slug, name, data, updated_at")
    .eq("category", category)
    .order("name", { ascending: true });

  if (q) query = query.ilike("name", `%${q}%`);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const deduped = dedupeGamedata((data ?? []) as GamedataRow[]);
  const paged = deduped.slice(offset, offset + limit);

  return NextResponse.json({ data: paged, total: deduped.length, page, limit, category });
}
