import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type SpellRow = {
  id: string;
  is_official: boolean | null;
  level: number;
  name: string;
  traditions: unknown;
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
  const paged = filtered.slice(offset, offset + limit);

  return NextResponse.json({ data: paged, total: filtered.length, page, limit });
}
