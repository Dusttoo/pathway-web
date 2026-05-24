import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// character_known_spells was added in 20260513000000_nethys_integration.sql.
// After applying the migration, regen database.types.ts and drop this cast.
type UntypedClient = SupabaseClient;

const TRADITIONS = new Set(["arcane", "divine", "occult", "primal", "focus"]);
const SOURCES = new Set(["spellbook", "repertoire", "innate", "focus", "staff", "scroll"]);

type HomebrewSpellRow = {
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

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
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

async function ensureSpellReference(
  service: UntypedClient,
  spellId: string
): Promise<string | null> {
  const { data: existing, error: existingError } = await service
    .from("spells")
    .select("id")
    .eq("id", spellId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing?.id) return null;

  const { data: homebrew, error: homebrewError } = await service
    .from("homebrew_entries")
    .select("id, name, type, data, added_by, created_at, updated_at")
    .eq("id", spellId)
    .eq("type", "spell")
    .maybeSingle();

  if (homebrewError) throw homebrewError;
  if (!homebrew) return "Spell not found.";

  const row = homebrew as HomebrewSpellRow;
  const data = row.data ?? {};
  const spellType = normalize(text(data.type) ?? "");
  const isCantrip = spellType === "cantrip" || spellType === "focus cantrip";
  const isFocus = spellType === "focus" || spellType === "focus cantrip" || booleanValue(data.is_focus_spell);
  const isRitual = spellType === "ritual" || booleanValue(data.is_ritual);

  const { error: insertError } = await service.from("spells").upsert(
    {
      id: row.id,
      name: text(data.name) ?? text(row.name) ?? "Unnamed Spell",
      description: text(data.description) ?? text(data.summary) ?? "",
      level: isCantrip ? 0 : numberValue(data.level, 1),
      traditions: listValues(data.traditions),
      traits: listValues(data.traits),
      cast_actions: text(data.cast_actions) ?? text(data.cast),
      range_text: text(data.range_text) ?? text(data.range) ?? "",
      duration: text(data.duration) ?? "",
      area: text(data.area),
      defense: text(data.defense),
      heightening: data.heightening ?? data.heightened ?? null,
      rarity: text(data.rarity) ?? "Common",
      source: sourceText(data),
      is_focus_spell: isFocus,
      is_ritual: isRitual,
      is_official: false,
      created_by_user_id: null,
      spell_metadata: { homebrew_entry_id: row.id },
      classes: listValues(data.classes),
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
  const referenceError = await ensureSpellReference(service, body.spell_id);
  if (referenceError) return NextResponse.json({ error: referenceError }, { status: 404 });

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
