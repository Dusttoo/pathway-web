import { createServiceClient } from "@/lib/supabase/server";
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "25")));
  const offset = (page - 1) * limit;

  const includeHomebrew = searchParams.get("include_homebrew") === "true";

  const supabase = createServiceClient();
  let query = supabase
    .from("character_classes")
    .select("*", { count: "exact" })
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);

  if (!includeHomebrew) {
    query = query.eq("is_official", true);
  }

  if (q) query = query.ilike("name", `%${q}%`);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: normalizeCasterFlags((data ?? []) as ClassRow[]),
    total: count,
    page,
    limit,
  });
}
