import { createServiceClient } from "@/lib/supabase/server";
import { fetchVirtualHomebrew, virtualAncestry } from "@/lib/homebrew/virtual-content";
import { NextResponse } from "next/server";

type AncestryRow = {
  ancestry_hp: number | null;
  attribute_boosts: unknown;
  attribute_flaws: unknown;
  bonus_languages: number | null;
  created_at: string | null;
  created_by_user_id: string | null;
  description: string | null;
  discord_guild_id: string | null;
  id: string;
  is_official: boolean | null;
  languages: unknown;
  name: string;
  rarity: string | null;
  senses: unknown;
  size: string | null;
  source: string | null;
  special_abilities: unknown;
  speed: number | null;
  traits: unknown;
  updated_at: string | null;
};

function ancestryKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function hasStructuredJson(value: unknown): boolean {
  return Array.isArray(value) ? value.length > 0 : !!value && typeof value === "object";
}

function completenessScore(row: AncestryRow): number {
  const rarity = row.rarity?.toLowerCase();
  const descriptionLength = row.description?.trim().length ?? 0;

  return (
    (row.is_official ? 1000 : 0) +
    (row.source ? 250 : 0) +
    (rarity && rarity !== "common" ? 150 : 0) +
    (hasStructuredJson(row.languages) ? 50 : 0) +
    (hasStructuredJson(row.traits) ? 50 : 0) +
    (hasStructuredJson(row.special_abilities) ? 50 : 0) +
    Math.min(descriptionLength, 500)
  );
}

function dedupeAncestries(rows: AncestryRow[]): AncestryRow[] {
  const byName = new Map<string, AncestryRow>();

  for (const row of rows) {
    const key = ancestryKey(row.name);
    const existing = byName.get(key);

    if (!existing || completenessScore(row) > completenessScore(existing)) {
      byName.set(key, row);
    }
  }

  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") ?? "25")));
  const offset = (page - 1) * limit;

  const includeHomebrew = searchParams.get("include_homebrew") === "true";

  const supabase = createServiceClient();
  let query = supabase.from("ancestries").select("*").order("name", { ascending: true });

  if (!includeHomebrew) {
    query = query.eq("is_official", true);
  }

  if (q) query = query.ilike("name", `%${q}%`);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const virtualRows = includeHomebrew ? await fetchVirtualHomebrew(supabase, "ancestry") : [];
  const virtualAncestries = virtualRows
    .map((row) => virtualAncestry(row) as AncestryRow)
    .filter((row) => !q || row.name.toLowerCase().includes(q.toLowerCase()));

  const deduped = dedupeAncestries([...((data ?? []) as AncestryRow[]), ...virtualAncestries]);
  const paged = deduped.slice(offset, offset + limit);

  return NextResponse.json({ data: paged, total: deduped.length, page, limit });
}
