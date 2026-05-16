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
  "impulse",
  "bonus",
]);

type HomebrewFeatRow = {
  id: string;
  name: string | null;
  type: string | null;
  data: Record<string, unknown> | null;
  added_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function listValues(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap((item) => listValues(item));
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value === "number" && Number.isFinite(value)) return [String(value)];
  return [];
}

function numberValue(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
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

function normalizeFeatType(value: unknown): string | null {
  const raw = text(value)?.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!raw) return null;
  if (raw === "class feat" || raw === "class") return "class_feat";
  if (raw === "skill feat" || raw === "skill") return "skill";
  if (raw === "ancestry feat" || raw === "ancestry") return "ancestry";
  if (raw === "general feat" || raw === "general") return "general";
  if (raw === "archetype feat" || raw === "archetype") return "archetype";
  if (
    raw === "heritage feat" ||
    raw === "heritage" ||
    raw === "lineage feat" ||
    raw === "lineage"
  ) {
    return "ancestry";
  }
  if (raw === "bonus feat" || raw === "bonus") return "bonus";
  return raw.replace(/\s+feat$/, "").replace(/\s+/g, "_");
}

async function ensureFeatReference(service: UntypedClient, featId: string): Promise<string | null> {
  const { data: existing, error: existingError } = await service
    .from("feats")
    .select("id")
    .eq("id", featId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing?.id) return null;

  const { data: homebrew, error: homebrewError } = await service
    .from("homebrew_entries")
    .select("id, name, type, data, added_by, created_at, updated_at")
    .eq("id", featId)
    .eq("type", "feat")
    .maybeSingle();

  if (homebrewError) throw homebrewError;
  if (!homebrew) return "Feat not found.";

  const row = homebrew as HomebrewFeatRow;
  const data = row.data ?? {};
  const metadata =
    data.feat_metadata &&
    typeof data.feat_metadata === "object" &&
    !Array.isArray(data.feat_metadata)
      ? (data.feat_metadata as Record<string, unknown>)
      : {};

  const { error: insertError } = await service.from("feats").upsert(
    {
      id: row.id,
      name: text(data.name) ?? text(row.name) ?? "Unnamed Feat",
      description: text(data.description) ?? text(data.benefit) ?? "",
      feat_type: normalizeFeatType(data.feat_type),
      level: numberValue(data.level, 1),
      traits: listValues(data.traits),
      prerequisites: text(data.prerequisites),
      action_cost: text(data.action_cost),
      trigger: text(data.trigger),
      rarity: text(data.rarity) ?? "Common",
      source: sourceText(data),
      is_official: false,
      created_by_user_id: null,
      feat_metadata: {
        ...metadata,
        homebrew_entry_id: row.id,
        classes: listValues(data.classes ?? metadata.classes),
        ancestry: listValues(data.ancestry ?? data.ancestries ?? metadata.ancestry),
        archetype: listValues(data.archetype ?? data.archetypes ?? metadata.archetype),
      },
    },
    { onConflict: "id" }
  );

  if (insertError) throw insertError;
  return null;
}

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
  const referenceError = await ensureFeatReference(service, body.feat_id);
  if (referenceError) return NextResponse.json({ error: referenceError }, { status: 404 });

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
