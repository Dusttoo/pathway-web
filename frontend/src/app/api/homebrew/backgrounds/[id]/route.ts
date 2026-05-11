import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { Json } from "@/lib/types/database.types";

async function resolveOwnership(id: string) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return { error: "Unauthorized", status: 401 } as const;

  const service = createServiceClient();
  const discordId =
    authUser.identities?.find((i) => i.provider === "discord")
      ?.identity_data?.provider_id ?? authUser.id;

  const { data: dbUser } = await service
    .from("users")
    .select("id")
    .eq("discord_id", discordId)
    .maybeSingle();

  if (!dbUser) return { error: "User not found", status: 404 } as const;

  const { data: bg } = await service
    .from("backgrounds")
    .select("id, created_by_user_id, is_official")
    .eq("id", id)
    .maybeSingle();

  if (!bg || bg.is_official || bg.created_by_user_id !== dbUser.id) {
    return { error: "Not found or not yours", status: 403 } as const;
  }

  return { service, appUserId: dbUser.id } as const;
}

// ── PATCH /api/homebrew/backgrounds/[id] ──────────────────────────────────────
// Body: { name?, description?, trained_skill?, lore_skill? }

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const resolved = await resolveOwnership(id);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  let body: {
    name?: string;
    description?: string;
    trained_skill?: string;
    lore_skill?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, description, trained_skill, lore_skill } = body;

  const updates: {
    name?: string;
    description?: string | null;
    skill_proficiencies?: Json;
    lore_skills?: Json;
  } = {};

  if (name !== undefined) updates.name = name.trim();
  if (description !== undefined) updates.description = description || null;

  if (trained_skill !== undefined) {
    const skillProfs: Record<string, number> = {};
    if (trained_skill) skillProfs[trained_skill] = 2;
    updates.skill_proficiencies = skillProfs as Json;
  }

  if (lore_skill !== undefined) {
    updates.lore_skills = (lore_skill.trim() ? [lore_skill.trim()] : []) as Json;
  }

  const { data, error } = await resolved.service
    .from("backgrounds")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
