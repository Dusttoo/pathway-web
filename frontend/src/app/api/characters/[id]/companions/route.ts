import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// ── GET /api/characters/[id]/companions ───────────────────────────────────────
// Returns all companions for the authenticated user's character.
// [id] is the Supabase character UUID.

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: characterId } = await params;

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();

  // Resolve the Supabase user_id from Discord OAuth identity
  const discordId =
    authUser.identities?.find((i) => i.provider === "discord")
      ?.identity_data?.provider_id ?? authUser.id;

  const { data: dbUser } = await service
    .from("users")
    .select("id")
    .eq("discord_id", discordId)
    .maybeSingle();

  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Verify the character belongs to this user
  const { data: character } = await service
    .from("characters")
    .select("char_key")
    .eq("id", characterId)
    .eq("user_id", dbUser.id)
    .maybeSingle();

  if (!character) return NextResponse.json({ error: "Character not found" }, { status: 404 });

  // char_key is null for web-only characters that the bot hasn't synced yet — no companions possible.
  if (!character.char_key) return NextResponse.json({ data: [] });

  const { data: companions, error } = await service
    .from("companions")
    .select("*")
    .eq("user_id", dbUser.id)
    .eq("char_key", character.char_key)
    .order("is_active", { ascending: false })
    .order("display_name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: companions ?? [] });
}
