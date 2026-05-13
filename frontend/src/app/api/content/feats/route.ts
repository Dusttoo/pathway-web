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

function featKey(row: FeatRow): string {
  return [
    row.name.trim().toLowerCase().replace(/\s+/g, " "),
    row.level,
    row.feat_type?.trim().toLowerCase() ?? "",
  ].join("|");
}

function hasStructuredJson(value: unknown): boolean {
  return Array.isArray(value) ? value.length > 0 : !!value && typeof value === "object";
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
  const ancestry = searchParams.get("ancestry");
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
  if (className) query = query.contains("feat_metadata->classes", [className]);
  if (ancestry) query = query.contains("feat_metadata->ancestry", [ancestry]);
  if (archetype) query = query.contains("feat_metadata->archetype", [archetype]);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const deduped = dedupeFeats((data ?? []) as FeatRow[]);
  const paged = deduped.slice(offset, offset + limit);

  return NextResponse.json({ data: paged, total: deduped.length, page, limit });
}
