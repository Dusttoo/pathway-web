import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { Json } from "@/lib/types/database.types";

type DowntimeLogEntry = {
  date: string;
  delta: number;
  balance: number;
  reason: string;
  by?: string;
};

async function resolveUserId(authUser: {
  id: string;
  identities?: { provider: string; identity_data?: Record<string, string> }[];
}): Promise<string | null> {
  const discordId =
    authUser.identities?.find((i) => i.provider === "discord")
      ?.identity_data?.provider_id ?? authUser.id;
  const service = createServiceClient();
  const { data } = await service
    .from("users")
    .select("id")
    .eq("discord_id", discordId)
    .single();
  return data?.id ?? null;
}

// ── POST /api/characters/[id]/downtime — spend or gain downtime days ──────────
// Body: { delta: number, reason: string }
// Positive delta = gain days, negative delta = spend days

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: characterId } = await params;

  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await resolveUserId(authUser);
  if (!userId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await request.json();
  const { delta, reason = "" } = body;

  if (typeof delta !== "number" || !Number.isInteger(delta) || delta === 0) {
    return NextResponse.json({ error: "delta must be a non-zero integer" }, { status: 400 });
  }

  const service = createServiceClient();

  // Verify character ownership and get char_key
  const { data: character } = await service
    .from("characters")
    .select("char_key")
    .eq("id", characterId)
    .eq("user_id", userId)
    .single();

  if (!character?.char_key) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const charKey = character.char_key;

  // Get current downtime row
  const { data: existing } = await service
    .from("downtime")
    .select("*")
    .eq("char_key", charKey)
    .maybeSingle();

  const currentBank = existing?.bank ?? 0;
  const log: DowntimeLogEntry[] = (existing?.log as unknown as DowntimeLogEntry[]) ?? [];

  // If spending more than available, clamp
  const actualDelta = delta < 0 ? Math.max(delta, -currentBank) : delta;
  const newBank = currentBank + actualDelta;

  if (actualDelta === 0) {
    return NextResponse.json(
      { error: `Not enough downtime days (have ${currentBank}).` },
      { status: 400 }
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const newEntry: DowntimeLogEntry = {
    date: today,
    delta: actualDelta,
    balance: newBank,
    reason: reason.trim() || (actualDelta > 0 ? "Web: days added" : "Web: days spent"),
    by: "web",
  };

  const newLog = [...log, newEntry];

  if (existing) {
    const { data, error } = await service
      .from("downtime")
      .update({ bank: newBank, log: newLog as unknown as Json })
      .eq("char_key", charKey)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ...data, actualDelta, clipped: actualDelta !== delta });
  } else {
    // Create a new downtime row (usually shouldn't happen — bot creates it)
    const { data, error } = await service
      .from("downtime")
      .insert({
        char_key: charKey,
        user_id: userId,
        bank: newBank,
        log: newLog as unknown as Json,
        last_accrual_date: today,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ...data, actualDelta, clipped: false }, { status: 201 });
  }
}
