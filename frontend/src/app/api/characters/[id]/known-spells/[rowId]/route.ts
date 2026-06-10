import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// See note in ../route.ts about regenerating database.types.ts.
type UntypedClient = SupabaseClient;

type SpellOverlayEntry = {
  caster?: string;
  spell?: string;
  rank?: number;
  source?: string;
  row_id?: string;
};

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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; rowId: string }> }
) {
  const { id, rowId } = await params;
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await resolveUserId(authUser);
  if (!userId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const service = createServiceClient();
  const { data: owner } = await service
    .from("characters")
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!owner) return NextResponse.json({ error: "Character not found" }, { status: 404 });

  const untyped = service as unknown as UntypedClient;
  const { data: spellRow, error: spellFetchError } = await untyped
    .from("character_known_spells")
    .select("id, rank, spell:spells(name)")
    .eq("id", rowId)
    .eq("character_id", id)
    .maybeSingle();
  if (spellFetchError) return NextResponse.json({ error: spellFetchError.message }, { status: 400 });

  const { error } = await untyped
    .from("character_known_spells")
    .delete()
    .eq("id", rowId)
    .eq("character_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data: character, error: characterError } = await untyped
    .from("characters")
    .select("overlay")
    .eq("id", id)
    .maybeSingle();
  if (characterError) return NextResponse.json({ error: characterError.message }, { status: 400 });
  if (character?.overlay && typeof character.overlay === "object" && !Array.isArray(character.overlay)) {
    const overlay = character.overlay as Record<string, unknown>;
    const spellbook = Array.isArray(overlay.spellbook)
      ? (overlay.spellbook as SpellOverlayEntry[])
      : [];
    const spellName =
      spellRow?.spell && typeof spellRow.spell === "object" && "name" in spellRow.spell
        ? String((spellRow.spell as { name?: string | null }).name ?? "").toLowerCase()
        : "";
    const nextSpellbook = spellbook.filter((entry) => {
      if (entry.row_id === rowId) return false;
      if (
        entry.source === "pathway-web" &&
        spellName &&
        entry.spell?.toLowerCase() === spellName &&
        Number(entry.rank ?? -1) === Number(spellRow?.rank ?? -2)
      ) {
        return false;
      }
      return true;
    });
    if (nextSpellbook.length !== spellbook.length) {
      const { error: overlayError } = await untyped
        .from("characters")
        .update({ overlay: { ...overlay, spellbook: nextSpellbook } })
        .eq("id", id);
      if (overlayError) return NextResponse.json({ error: overlayError.message }, { status: 400 });
    }
  }
  return new Response(null, { status: 204 });
}
