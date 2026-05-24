import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, { params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  if (!UUID_RE.test(shareId)) {
    return NextResponse.json({ error: "Invalid share link" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: character, error } = await service
    .from("characters")
    .select("*")
    .eq("is_public", true)
    .or(`public_share_id.eq.${shareId},id.eq.${shareId}`)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!character) {
    return NextResponse.json({ error: "Shared character not found" }, { status: 404 });
  }

  const safeCharacter = {
    id: character.id,
    name: character.name,
    ancestry_name: character.ancestry_name,
    heritage_name: character.heritage_name,
    class_name: character.class_name,
    background_name: character.background_name,
    level: character.level,
    experience: character.experience,
    pathbuilder_data: character.pathbuilder_data,
    hero_points: character.hero_points,
    dying: character.dying,
    wounded: character.wounded,
    current_hp: character.current_hp,
    source: character.source,
    status: character.status,
    created_at: character.created_at,
    updated_at: character.updated_at,
    is_public: character.is_public,
    public_share_id: character.public_share_id,
  };

  type QueryResult = Promise<{ data: unknown; error: { message: string } | null }>;
  type QueryBuilder = QueryResult & {
    eq: (column: string, value: string) => QueryBuilder;
    order: (column: string, options?: { ascending?: boolean }) => QueryResult;
  };
  const untyped = service as never as {
    from: (table: string) => { select: (columns: string) => QueryBuilder };
  };

  const [featsResult, spellsResult] = await Promise.all([
    untyped
      .from("character_feats")
      .select(
        "id, feat_slot, level_acquired, notes, feat:feats(name, feat_type, source, level, description)"
      )
      .eq("character_id", character.id)
      .order("level_acquired", { ascending: true }),
    untyped
      .from("character_known_spells")
      .select(
        "id, tradition, spell_source, is_signature, notes, spell:spells(name, description, source, traditions)"
      )
      .eq("character_id", character.id),
  ]);

  if (featsResult.error) {
    return NextResponse.json({ error: featsResult.error.message }, { status: 500 });
  }
  if (spellsResult.error) {
    return NextResponse.json({ error: spellsResult.error.message }, { status: 500 });
  }

  return NextResponse.json({
    character: safeCharacter,
    feats: featsResult.data ?? [],
    known_spells: Array.isArray(spellsResult.data)
      ? spellsResult.data.map((spell) =>
          typeof spell === "object" && spell ? { ...spell, rank: 0 } : spell
        )
      : [],
  });
}
