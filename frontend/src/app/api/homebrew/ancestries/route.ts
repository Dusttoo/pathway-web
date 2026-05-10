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

  const { data: ancestries, error } = await ctx.service
    .from("ancestries")
    .select("*, heritages(*)")
    .eq("is_official", false)
    .eq("created_by_user_id", ctx.appUserId)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(ancestries ?? []);
}

export async function POST(request: Request) {
  const ctx = await resolveUser();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, ancestry_hp, speed, size, description, heritages = [] } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const { data: ancestry, error: ancestryErr } = await ctx.service
    .from("ancestries")
    .insert({
      name: name.trim(),
      ancestry_hp: ancestry_hp ?? 8,
      speed: speed ?? 25,
      size: size ?? "Medium",
      description: description ?? null,
      is_official: false,
      created_by_user_id: ctx.appUserId,
      source: "Homebrew",
      attribute_boosts: [],
      attribute_flaws: [],
      languages: [],
      bonus_languages: 0,
      senses: [],
      traits: [],
      special_abilities: [],
    })
    .select()
    .single();

  if (ancestryErr || !ancestry) {
    return NextResponse.json({ error: ancestryErr?.message ?? "Insert failed" }, { status: 400 });
  }

  // Insert heritages if provided
  const heritageRows = (heritages as { name: string; description?: string }[]).filter((h) => h.name?.trim());
  if (heritageRows.length > 0) {
    const { error: hErr } = await ctx.service.from("heritages").insert(
      heritageRows.map((h) => ({
        ancestry_id: ancestry.id,
        name: h.name.trim(),
        description: h.description ?? null,
        is_official: false,
        is_versatile: false,
        benefits: {},
        traits: [],
      })),
    );
    if (hErr) return NextResponse.json({ error: hErr.message }, { status: 400 });
  }

  return NextResponse.json(ancestry, { status: 201 });
}

export async function DELETE(request: Request) {
  const ctx = await resolveUser();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  // Ownership check
  const { data: existing } = await ctx.service
    .from("ancestries")
    .select("created_by_user_id, is_official")
    .eq("id", id)
    .single();

  if (!existing || existing.is_official || existing.created_by_user_id !== ctx.appUserId) {
    return NextResponse.json({ error: "Not found or not yours" }, { status: 403 });
  }

  await ctx.service.from("heritages").delete().eq("ancestry_id", id);
  const { error } = await ctx.service.from("ancestries").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
