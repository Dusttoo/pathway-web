import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("character_classes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...data,
    is_spellcaster: data.is_official
      ? OFFICIAL_SPELLCASTER_CLASSES.has(data.name.trim().toLowerCase())
      : data.is_spellcaster,
  });
}
