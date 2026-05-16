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

type HomebrewRow = {
  id: string;
  name: string | null;
  type: string | null;
  data: Record<string, unknown> | null;
  added_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
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

function booleanValue(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = normalize(value);
    return normalized === "true" || normalized === "yes" || normalized === "focus";
  }
  return false;
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
  if (expected === "focus") return !!row.is_focus_spell;
  return listValues(row.traditions).some((value) => normalize(value) === expected);
}

function sourceText(data: Record<string, unknown>): string {
  if (data.source && typeof data.source === "object" && !Array.isArray(data.source)) {
    const source = data.source as Record<string, unknown>;
    const sourceName = text(source.source_text) ?? text(source.book);
    const page = text(source.page);
    if (sourceName && page) return `${sourceName} pg. ${page}`;
    if (sourceName) return sourceName;
  }

  return text(data.source) ?? text(data.source_book) ?? "Homebrew";
}

function virtualType(row: HomebrewRow): string {
  const dataType = typeof row.data?._homebrew_type === "string" ? row.data._homebrew_type : null;
  return dataType || row.type || "";
}

function virtualSpell(row: HomebrewRow): SpellRow {
  const data = row.data ?? {};
  const spellType = normalize(text(data.type) ?? "");
  const isFocus = spellType === "focus" || booleanValue(data.is_focus_spell);
  const isRitual = spellType === "ritual" || booleanValue(data.is_ritual);
  return {
    area: text(data.area),
    cast_actions: text(data.cast_actions) ?? text(data.cast),
    classes: listValues(data.classes),
    defense: text(data.defense),
    description: text(data.description) ?? text(data.summary) ?? "",
    duration: text(data.duration) ?? "",
    heightening: data.heightening ?? data.heightened ?? null,
    id: row.id,
    is_focus_spell: isFocus,
    is_official: false,
    is_ritual: isRitual,
    level: spellType === "cantrip" ? 0 : numberValue(data.level, 1),
    name: text(data.name) ?? text(row.name) ?? "Unnamed Spell",
    range_text: text(data.range_text) ?? text(data.range) ?? "",
    rarity: text(data.rarity) ?? "Common",
    source: sourceText(data),
    spell_metadata: { homebrew_entry_id: row.id },
    traditions: listValues(data.traditions),
    traits: listValues(data.traits),
  };
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

  const [{ data, error }, { data: homebrewData, error: homebrewError }] = await Promise.all([
    query,
    supabase
      .from("homebrew_entries")
      .select("*")
      .eq("type", "spell")
      .order("name", { ascending: true }),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (homebrewError) {
    return NextResponse.json({ error: homebrewError.message }, { status: 500 });
  }

  const homebrewRows = ((homebrewData ?? []) as HomebrewRow[])
    .filter((row) => virtualType(row) === "spell")
    .map(virtualSpell);
  const filtered = [...((data ?? []) as SpellRow[]), ...homebrewRows].filter(
    (spell) =>
      matchesTradition(spell, isFocus === "true" ? null : tradition) &&
      (!q || normalize(spell.name).includes(normalize(q))) &&
      (!level || spell.level === parseInt(level, 10)) &&
      (isFocus !== "true" || !!spell.is_focus_spell) &&
      (isRitual !== "true" || !!spell.is_ritual)
  );
  const deduped = dedupeSpells(filtered);
  const paged = deduped.slice(offset, offset + limit);

  return NextResponse.json({ data: paged, total: deduped.length, page, limit });
}
