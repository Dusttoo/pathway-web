import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type MonsterRow = {
  ac: number | null;
  abilities: unknown;
  attacks: unknown;
  creature_type: string | null;
  description: string | null;
  hp: number | null;
  id: string;
  is_companion: boolean | null;
  is_official: boolean | null;
  level: number | null;
  monster_metadata: unknown;
  name: string;
  rarity: string | null;
  size: string | null;
  source: string | null;
  traits: unknown;
};

function normalizedName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function hasStructuredJson(value: unknown): boolean {
  return Array.isArray(value) ? value.length > 0 : !!value && typeof value === "object";
}

function completenessScore(row: MonsterRow): number {
  const descriptionLength = row.description?.trim().length ?? 0;

  return (
    (row.is_official ? 1000 : 0) +
    (row.source ? 250 : 0) +
    (row.rarity && row.rarity.toLowerCase() !== "common" ? 100 : 0) +
    (row.hp ? 75 : 0) +
    (row.ac ? 75 : 0) +
    (row.size ? 50 : 0) +
    (row.creature_type ? 50 : 0) +
    (hasStructuredJson(row.traits) ? 75 : 0) +
    (hasStructuredJson(row.attacks) ? 75 : 0) +
    (hasStructuredJson(row.abilities) ? 75 : 0) +
    (hasStructuredJson(row.monster_metadata) ? 50 : 0) +
    Math.min(descriptionLength, 750)
  );
}

function monsterKey(row: MonsterRow): string {
  return normalizedName(row.name);
}

function dedupeMonsters(rows: MonsterRow[]): MonsterRow[] {
  const byMonster = new Map<string, MonsterRow>();

  for (const row of rows) {
    const key = monsterKey(row);
    const existing = byMonster.get(key);

    if (!existing || completenessScore(row) > completenessScore(existing)) {
      byMonster.set(key, row);
    }
  }

  return [...byMonster.values()].sort(
    (a, b) => (a.level ?? 0) - (b.level ?? 0) || a.name.localeCompare(b.name)
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const level = searchParams.get("level");
  const creatureType = searchParams.get("creature_type");
  const isCompanion = searchParams.get("is_companion");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "25")));
  const offset = (page - 1) * limit;

  const supabase = createServiceClient();
  let query = supabase
    .from("monsters")
    .select("*")
    .eq("is_official", true)
    .order("name", { ascending: true });

  if (q) query = query.ilike("name", `%${q}%`);
  if (level) query = query.eq("level", parseInt(level));
  if (creatureType) query = query.eq("creature_type", creatureType);
  if (isCompanion === "true") query = query.eq("is_companion", true);
  if (isCompanion === "false") query = query.eq("is_companion", false);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const deduped = dedupeMonsters((data ?? []) as MonsterRow[]);
  const paged = deduped.slice(offset, offset + limit);

  return NextResponse.json({ data: paged, total: deduped.length, page, limit });
}
