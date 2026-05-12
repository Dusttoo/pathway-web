import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// character_known_spells was added in 20260513000000_nethys_integration.sql.
// After applying the migration, regen database.types.ts and drop this cast.
type UntypedClient = SupabaseClient;

const TRADITIONS = new Set(["arcane", "divine", "occult", "primal"]);
const SOURCES = new Set(["spellbook", "repertoire", "innate", "focus", "staff", "scroll"]);

async function resolveUserId(authUser: {
  id: string;
  identities?: { provider: string; identity_data?: Record<string, string> }[];
}): Promise<string | null> {
  const discordId =
    authUser.identities?.find((i) => i.provider === "discord")?.identity_data?.provider_id ??
    authUser.id;
  const service = createServiceClient();
  const { data } = await service.from("users").select("id").eq("discord_id", discordId).single();
  return data?.id ?? null;
}

async function assertOwnsCharacter(characterId: string, userId: string): Promise<boolean> {
  const service = createServiceClient();
  const { data } = await service
    .from("characters")
    .select("id")
    .eq("id", characterId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await resolveUserId(authUser);
  if (!userId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (!(await assertOwnsCharacter(id, userId))) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const service = createServiceClient() as unknown as UntypedClient;
  const { data, error } = await service
    .from("character_known_spells")
    .select("id, spell_id, tradition, rank, spell_source, is_signature, notes, spell:spells(*)")
    .eq("character_id", id)
    .order("rank", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await resolveUserId(authUser);
  if (!userId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (!(await assertOwnsCharacter(id, userId))) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as {
    spell_id?: string;
    tradition?: string;
    rank?: number;
    spell_source?: string;
    is_signature?: boolean;
    notes?: string | null;
  } | null;

  if (!body?.spell_id || !body.tradition) {
    return NextResponse.json({ error: "spell_id and tradition are required" }, { status: 400 });
  }
  if (!TRADITIONS.has(body.tradition)) {
    return NextResponse.json({ error: `Invalid tradition: ${body.tradition}` }, { status: 400 });
  }
  const spellSource = body.spell_source ?? "spellbook";
  if (!SOURCES.has(spellSource)) {
    return NextResponse.json({ error: `Invalid spell_source: ${spellSource}` }, { status: 400 });
  }
  const rank = Math.max(0, Math.min(10, Math.round(body.rank ?? 1)));

  const service = createServiceClient() as unknown as UntypedClient;
  const { data, error } = await service
    .from("character_known_spells")
    .insert({
      character_id: id,
      spell_id: body.spell_id,
      tradition: body.tradition,
      rank,
      spell_source: spellSource,
      is_signature: body.is_signature ?? false,
      notes: body.notes ?? null,
    })
    .select("id, spell_id, tradition, rank, spell_source, is_signature, notes, spell:spells(*)")
    .single();

  if (error) {
    const status = error.code === "23505" ? 409 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json(data, { status: 201 });
}
