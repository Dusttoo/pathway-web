import { createServiceClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { fetchVirtualHomebrew, virtualClass } from "@/lib/homebrew/virtual-content";
import { NextResponse } from "next/server";

type ClassRow = {
  class_features: unknown;
  class_hp: number;
  class_metadata: unknown;
  created_at: string;
  created_by_user_id: string | null;
  description: string | null;
  discord_guild_id: string | null;
  id: string;
  initial_proficiencies: unknown;
  is_official: boolean;
  is_spellcaster: boolean;
  key_attribute: unknown;
  name: string;
  source: string | null;
  spellcasting_ability: string | null;
  updated_at: string;
};

const OFFICIAL_SPELLCASTER_CLASSES = new Set(
  [
    "Animist",
    "Bard",
    "Cleric",
    "Druid",
    "Magus",
    "Necromancer",
    "Oracle",
    "Psychic",
    "Sorcerer",
    "Summoner",
    "Witch",
    "Wizard",
  ].map((name) => name.toLowerCase())
);

function normalizeCasterFlags(rows: ClassRow[]): ClassRow[] {
  return rows.map((row) => {
    if (!row.is_official) return row;

    return {
      ...row,
      is_spellcaster: OFFICIAL_SPELLCASTER_CLASSES.has(row.name.trim().toLowerCase()),
    };
  });
}

function normalizedName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function hasStructuredJson(value: unknown): boolean {
  return Array.isArray(value) ? value.length > 0 : !!value && typeof value === "object";
}

function completenessScore(row: ClassRow): number {
  const descriptionLength = row.description?.trim().length ?? 0;

  return (
    (row.is_official ? 1000 : 0) +
    (row.source ? 250 : 0) +
    (row.class_hp ? 100 : 0) +
    (row.is_spellcaster ? 75 : 0) +
    (row.spellcasting_ability ? 75 : 0) +
    (hasStructuredJson(row.key_attribute) ? 75 : 0) +
    (hasStructuredJson(row.initial_proficiencies) ? 75 : 0) +
    (hasStructuredJson(row.class_features) ? 75 : 0) +
    (hasStructuredJson(row.class_metadata) ? 50 : 0) +
    Math.min(descriptionLength, 750)
  );
}

function dedupeClasses(rows: ClassRow[]): ClassRow[] {
  const byClass = new Map<string, ClassRow>();

  for (const row of rows) {
    const key = normalizedName(row.name);
    const existing = byClass.get(key);

    if (!existing || completenessScore(row) > completenessScore(existing)) {
      byClass.set(key, row);
    }
  }

  return [...byClass.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "25")));
  const offset = (page - 1) * limit;

  const includeHomebrew = searchParams.get("include_homebrew") === "true";

  const supabase = createServiceClient();
  let query = supabase.from("character_classes").select("*").order("name", { ascending: true });

  if (!includeHomebrew) {
    query = query.eq("is_official", true);
  }

  if (q) query = query.ilike("name", `%${q}%`);

  const { data, error } = await fetchAllRows<ClassRow>(query);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const virtualRows = includeHomebrew ? await fetchVirtualHomebrew(supabase, "class") : [];
  const virtualClasses = virtualRows
    .map((row) => virtualClass(row) as ClassRow)
    .filter((row) => !q || row.name.toLowerCase().includes(q.toLowerCase()));

  const deduped = dedupeClasses(
    normalizeCasterFlags([...(data as ClassRow[]), ...virtualClasses])
  );
  const paged = deduped.slice(offset, offset + limit);

  return NextResponse.json({
    data: paged,
    total: deduped.length,
    page,
    limit,
  });
}
