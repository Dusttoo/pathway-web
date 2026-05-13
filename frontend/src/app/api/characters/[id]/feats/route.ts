import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// character_feats was added in migration 20260513000000_nethys_integration.sql.
// After applying the migration, regenerate database.types.ts and this cast
// can be replaced with the typed client.
type UntypedClient = SupabaseClient;

const VALID_SLOTS = new Set([
  "ancestry",
  "class",
  "general",
  "skill",
  "archetype",
  "free_archetype",
  "bonus",
]);

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
    .from("character_feats")
    .select("id, feat_id, feat_slot, level_acquired, selection, notes, feat:feats(*)")
    .eq("character_id", id)
    .order("level_acquired", { ascending: true });

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
    feat_id?: string;
    feat_slot?: string;
    level_acquired?: number;
    selection?: Record<string, unknown>;
    notes?: string | null;
  } | null;

  if (!body?.feat_id || !body.feat_slot) {
    return NextResponse.json({ error: "feat_id and feat_slot are required" }, { status: 400 });
  }
  if (!VALID_SLOTS.has(body.feat_slot)) {
    return NextResponse.json({ error: `Invalid feat_slot: ${body.feat_slot}` }, { status: 400 });
  }
  const level = Math.max(1, Math.min(20, Math.round(body.level_acquired ?? 1)));

  const service = createServiceClient() as unknown as UntypedClient;
  const { data, error } = await service
    .from("character_feats")
    .insert({
      character_id: id,
      feat_id: body.feat_id,
      feat_slot: body.feat_slot,
      level_acquired: level,
      selection: body.selection ?? {},
      notes: body.notes ?? null,
    })
    .select("id, feat_id, feat_slot, level_acquired, selection, notes, feat:feats(*)")
    .single();

  if (error) {
    const status = error.code === "23505" ? 409 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json(data, { status: 201 });
}
