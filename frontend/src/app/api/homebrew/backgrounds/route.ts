import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function resolveUser() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  const service = createServiceClient();
  const discordId =
    authUser.identities?.find((i) => i.provider === "discord")
      ?.identity_data?.provider_id ?? authUser.id;

  const { data: dbUser } = await service
    .from("users")
    .select("id")
    .eq("discord_id", discordId)
    .maybeSingle();

  return dbUser ? { service, appUserId: dbUser.id } : null;
}

export async function GET() {
  const ctx = await resolveUser();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await ctx.service
    .from("backgrounds")
    .select("*")
    .eq("is_official", false)
    .eq("created_by_user_id", ctx.appUserId)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const ctx = await resolveUser();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, description, trained_skill, lore_skill } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const skillProfs: Record<string, number> = {};
  if (trained_skill) skillProfs[trained_skill] = 2;

  const loreSkills = lore_skill?.trim() ? [lore_skill.trim()] : [];

  const { data, error } = await ctx.service
    .from("backgrounds")
    .insert({
      name: name.trim(),
      description: description ?? null,
      is_official: false,
      created_by_user_id: ctx.appUserId,
      source: "Homebrew",
      rarity: "common",
      attribute_boosts: [],
      skill_proficiencies: skillProfs,
      lore_skills: loreSkills,
      background_metadata: {},
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: Request) {
  const ctx = await resolveUser();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const { data: existing } = await ctx.service
    .from("backgrounds")
    .select("created_by_user_id, is_official")
    .eq("id", id)
    .single();

  if (!existing || existing.is_official || existing.created_by_user_id !== ctx.appUserId) {
    return NextResponse.json({ error: "Not found or not yours" }, { status: 403 });
  }

  const { error } = await ctx.service.from("backgrounds").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
