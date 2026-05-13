import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type SpellRow = {
  area: string | null;
  cast_actions: string | null;
  classes: unknown;
  defense: string | null;
  description: string;
  duration: string | null;
  heightening: unknown;
  id: string;
  is_focus_spell: boolean | null;
  is_official: boolean | null;
  is_ritual: boolean | null;
  level: number;
  name: string;
  range_text: string | null;
  rarity: string | null;
  source: string | null;
  spell_metadata: unknown;
  traditions: unknown;
  traits: unknown;
};

function listValues(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap((item) => listValues(item));
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function hasStructuredJson(value: unknown): boolean {
  return Array.isArray(value) ? value.length > 0 : !!value && typeof value === "object";
}

function spellKey(row: SpellRow): string {
  return [
    normalize(row.name),
    row.level,
    row.is_focus_spell ? "focus" : "spell",
    row.is_ritual ? "ritual" : "cast",
  ].join("|");
}

function completenessScore(row: SpellRow): number {
  const description = row.description?.trim() ?? "";
  const rawMarkupPenalty = /<title|<\/?[a-z][\s\S]*>/i.test(description) ? -500 : 0;

  return (
    (row.is_official ? 1000 : 0) +
    (row.source ? 250 : 0) +
    (row.rarity && row.rarity.toLowerCase() !== "common" ? 75 : 0) +
    (row.cast_actions ? 75 : 0) +
    (row.range_text ? 50 : 0) +
    (row.duration ? 50 : 0) +
    (row.area ? 50 : 0) +
    (row.defense ? 50 : 0) +
    (hasStructuredJson(row.traditions) ? 75 : 0) +
    (hasStructuredJson(row.traits) ? 50 : 0) +
    (hasStructuredJson(row.classes) ? 50 : 0) +
    (hasStructuredJson(row.heightening) ? 50 : 0) +
    (hasStructuredJson(row.spell_metadata) ? 50 : 0) +
    rawMarkupPenalty +
    Math.min(description.length, 750)
  );
}

function dedupeSpells(rows: SpellRow[]): SpellRow[] {
  const bySpell = new Map<string, SpellRow>();

  for (const row of rows) {
    const key = spellKey(row);
    const existing = bySpell.get(key);

    if (!existing || completenessScore(row) > completenessScore(existing)) {
      bySpell.set(key, row);
    }
  }

  return [...bySpell.values()].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

function matchesTradition(row: SpellRow, tradition: string | null): boolean {
  if (!tradition) return true;
  const expected = normalize(tradition);
  return listValues(row.traditions).some((value) => normalize(value) === expected);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const tradition = searchParams.get("tradition");
  const level = searchParams.get("level");
  const isFocus = searchParams.get("is_focus");
  const isRitual = searchParams.get("is_ritual");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "25")));
  const offset = (page - 1) * limit;

  const supabase = createServiceClient();
  let query = supabase
    .from("spells")
    .select("*")
    .eq("is_official", true)
    .order("level", { ascending: true })
    .order("name", { ascending: true });

  if (q) query = query.ilike("name", `%${q}%`);
  if (level) query = query.eq("level", parseInt(level));
  if (isFocus === "true") query = query.eq("is_focus_spell", true);
  if (isRitual === "true") query = query.eq("is_ritual", true);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const filtered = ((data ?? []) as SpellRow[]).filter((spell) =>
    matchesTradition(spell, tradition)
  );
  const deduped = dedupeSpells(filtered);
  const paged = deduped.slice(offset, offset + limit);

  return NextResponse.json({ data: paged, total: deduped.length, page, limit });
}
