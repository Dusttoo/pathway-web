import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { Json } from "@/lib/types/database.types";

type BotNote = {
  id: number;
  category: string;
  text: string;
  pinned: boolean;
  createdAt: string;
  editedAt: string | null;
  authorId: string;
  authorName: string;
};

const VALID_CATEGORIES = new Set(["npcs", "locations", "plot-threads", "influence", "items"]);

async function resolveUserId(authUser: {
  id: string;
  identities?: { provider: string; identity_data?: Record<string, string> }[];
}): Promise<{ userId: string; discordId: string } | null> {
  const discordId =
    authUser.identities?.find((i) => i.provider === "discord")
      ?.identity_data?.provider_id ?? authUser.id;
  const service = createServiceClient();
  const { data } = await service
    .from("users")
    .select("id, discord_username")
    .eq("discord_id", discordId)
    .single();
  if (!data) return null;
  return { userId: data.id, discordId };
}

// ── POST /api/characters/[id]/notes — add a note ──────────────────────────────

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: characterId } = await params;

  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resolved = await resolveUserId(authUser);
  if (!resolved) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const { userId, discordId } = resolved;

  const body = await request.json();
  const { text, category = "npcs", pinned = false } = body;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  if (!VALID_CATEGORIES.has(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const service = createServiceClient();

  // Verify the character belongs to this user
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

  // Get or create the notes row
  const { data: existing } = await service
    .from("character_notes")
    .select("*")
    .eq("char_key", charKey)
    .maybeSingle();

  const notes: BotNote[] = (existing?.notes as unknown as BotNote[]) ?? [];
  const nextId = (existing?.next_id ?? 1);

  // Get the user's display name
  const { data: userRow } = await service
    .from("users")
    .select("discord_username")
    .eq("id", userId)
    .single();

  const newNote: BotNote = {
    id: nextId,
    category,
    text: text.trim(),
    pinned: Boolean(pinned),
    createdAt: new Date().toISOString(),
    editedAt: null,
    authorId: discordId,
    authorName: userRow?.discord_username ?? "Web User",
  };

  const newNotes = [...notes, newNote];

  if (existing) {
    const { data, error } = await service
      .from("character_notes")
      .update({ notes: newNotes as unknown as Json, next_id: nextId + 1 })
      .eq("char_key", charKey)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } else {
    const { data, error } = await service
      .from("character_notes")
      .insert({
        char_key: charKey,
        user_id: userId,
        notes: newNotes as unknown as Json,
        next_id: nextId + 1,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  }
}

// ── DELETE /api/characters/[id]/notes — remove a note ────────────────────────

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: characterId } = await params;

  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resolved = await resolveUserId(authUser);
  if (!resolved) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const { userId } = resolved;

  const body = await request.json();
  const { noteId } = body;
  if (noteId === undefined) {
    return NextResponse.json({ error: "noteId is required" }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: character } = await service
    .from("characters")
    .select("char_key")
    .eq("id", characterId)
    .eq("user_id", userId)
    .single();

  if (!character?.char_key) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const { data: existing } = await service
    .from("character_notes")
    .select("notes")
    .eq("char_key", character.char_key)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "No notes found" }, { status: 404 });

  const notes = (existing.notes as unknown as BotNote[]) ?? [];
  const newNotes = notes.filter((n) => n.id !== noteId);

  const { data, error } = await service
    .from("character_notes")
    .update({ notes: newNotes as unknown as Json })
    .eq("char_key", character.char_key)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
