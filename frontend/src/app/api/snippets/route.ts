import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const MAX_USER_SNIPPETS = 50;

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

// ── POST /api/snippets — create a personal snippet ───────────────────────────

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await resolveUserId(authUser);
  if (!userId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await request.json();
  const { name, expansion } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!expansion || typeof expansion !== "string" || expansion.trim().length === 0) {
    return NextResponse.json({ error: "expansion is required" }, { status: 400 });
  }

  const snippetName = name.trim().toLowerCase().replace(/\s+/g, "-");
  const snippetExpansion = expansion.trim();

  const service = createServiceClient();
  const { data: existing } = await service
    .from("user_snippets")
    .select("snippets")
    .eq("user_id", userId)
    .maybeSingle();

  const snippets = (existing?.snippets as Record<string, string>) ?? {};

  if (!existing && Object.keys(snippets).length === 0) {
    // First snippet — create the row
  } else if (Object.keys(snippets).length >= MAX_USER_SNIPPETS && !(snippetName in snippets)) {
    return NextResponse.json(
      { error: `You've reached the ${MAX_USER_SNIPPETS} snippet limit.` },
      { status: 400 }
    );
  }

  const newSnippets = { ...snippets, [snippetName]: snippetExpansion };

  if (existing) {
    const { data, error } = await service
      .from("user_snippets")
      .update({ snippets: newSnippets })
      .eq("user_id", userId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } else {
    const { data, error } = await service
      .from("user_snippets")
      .insert({ user_id: userId, snippets: newSnippets })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  }
}

// ── DELETE /api/snippets — delete a personal snippet ─────────────────────────

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await resolveUserId(authUser);
  if (!userId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await request.json();
  const { name } = body;
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const service = createServiceClient();
  const { data: existing } = await service
    .from("user_snippets")
    .select("snippets")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "No snippets found" }, { status: 404 });

  const snippets = { ...((existing.snippets as Record<string, string>) ?? {}) };
  const snippetName = String(name).trim().toLowerCase().replace(/\s+/g, "-");

  if (!(snippetName in snippets)) {
    return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
  }

  delete snippets[snippetName];

  const { data, error } = await service
    .from("user_snippets")
    .update({ snippets })
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
