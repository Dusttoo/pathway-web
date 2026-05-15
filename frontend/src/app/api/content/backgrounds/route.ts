import { createServiceClient } from "@/lib/supabase/server";
import { fetchVirtualHomebrew, virtualBackground } from "@/lib/homebrew/virtual-content";
import { NextResponse } from "next/server";

type BackgroundRow = {
  attribute_boosts: unknown;
  background_metadata: unknown;
  created_at: string | null;
  created_by_user_id: string | null;
  description: string | null;
  discord_guild_id: string | null;
  id: string;
  is_official: boolean | null;
  lore_skills: unknown;
  name: string;
  rarity: string | null;
  skill_proficiencies: unknown;
  source: string | null;
  updated_at: string | null;
};

function normalizedName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function hasStructuredJson(value: unknown): boolean {
  return Array.isArray(value) ? value.length > 0 : !!value && typeof value === "object";
}

function completenessScore(row: BackgroundRow): number {
  const descriptionLength = row.description?.trim().length ?? 0;

  return (
    (row.is_official ? 1000 : 0) +
    (row.source ? 250 : 0) +
    (row.rarity && row.rarity.toLowerCase() !== "common" ? 100 : 0) +
    (hasStructuredJson(row.skill_proficiencies) ? 75 : 0) +
    (hasStructuredJson(row.lore_skills) ? 75 : 0) +
    (hasStructuredJson(row.attribute_boosts) ? 75 : 0) +
    (hasStructuredJson(row.background_metadata) ? 50 : 0) +
    Math.min(descriptionLength, 750)
  );
}

function dedupeBackgrounds(rows: BackgroundRow[]): BackgroundRow[] {
  const byBackground = new Map<string, BackgroundRow>();

  for (const row of rows) {
    const key = normalizedName(row.name);
    const existing = byBackground.get(key);

    if (!existing || completenessScore(row) > completenessScore(existing)) {
      byBackground.set(key, row);
    }
  }

  return [...byBackground.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") ?? "25")));
  const offset = (page - 1) * limit;

  const includeHomebrew = searchParams.get("include_homebrew") === "true";

  const supabase = createServiceClient();
  let query = supabase.from("backgrounds").select("*").order("name", { ascending: true });

  if (!includeHomebrew) {
    query = query.eq("is_official", true);
  }

  if (q) query = query.ilike("name", `%${q}%`);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const virtualRows = includeHomebrew ? await fetchVirtualHomebrew(supabase, "background") : [];
  const virtualBackgrounds = virtualRows
    .map((row) => virtualBackground(row) as BackgroundRow)
    .filter((row) => !q || row.name.toLowerCase().includes(q.toLowerCase()));

  const deduped = dedupeBackgrounds([...((data ?? []) as BackgroundRow[]), ...virtualBackgrounds]);
  const paged = deduped.slice(offset, offset + limit);

  return NextResponse.json({ data: paged, total: deduped.length, page, limit });
}
