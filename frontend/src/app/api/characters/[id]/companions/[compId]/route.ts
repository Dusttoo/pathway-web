import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { TablesUpdate } from "@/lib/types/database.types";

const VALID_FORMS = new Set(["young", "mature", "nimble", "savage"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; compId: string }> }
) {
  const { id: characterId, compId } = await params;

  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();

  // Resolve Discord → users.id
  const discordId =
    authUser.identities?.find((i) => i.provider === "discord")
      ?.identity_data?.provider_id ?? authUser.id;

  const { data: dbUser } = await service
    .from("users")
    .select("id")
    .eq("discord_id", discordId)
    .maybeSingle();
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Verify character belongs to this user and get char_key
  const { data: character } = await service
    .from("characters")
    .select("char_key")
    .eq("id", characterId)
    .eq("user_id", dbUser.id)
    .maybeSingle();
  if (!character) return NextResponse.json({ error: "Character not found" }, { status: 404 });

  // Verify companion belongs to this user + character
  const { data: existing } = await service
    .from("companions")
    .select("id")
    .eq("id", compId)
    .eq("user_id", dbUser.id)
    .eq("char_key", character.char_key ?? "")
    .maybeSingle();
  if (!existing) return NextResponse.json({ error: "Companion not found" }, { status: 404 });

  const body = await request.json() as {
    current_hp?: number | null;
    notes?:      string;
    form?:       string;
  };

  const updates: TablesUpdate<"companions"> = {};

  if ("current_hp" in body) {
    // null = "not in combat"; numbers are clamped to >= 0
    updates.current_hp = body.current_hp === null || body.current_hp === undefined
      ? null
      : Math.max(0, Math.round(body.current_hp));
  }
  if (body.notes !== undefined) {
    updates.notes = String(body.notes).slice(0, 2000);
  }
  if (body.form !== undefined) {
    if (!VALID_FORMS.has(body.form)) {
      return NextResponse.json({ error: `Invalid form — must be one of: ${[...VALID_FORMS].join(", ")}` }, { status: 400 });
    }
    updates.form = body.form;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await service
    .from("companions")
    .update(updates)
    .eq("id", compId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
