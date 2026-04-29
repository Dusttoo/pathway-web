import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("guild_settings")
    .select("*")
    .eq("discord_guild_id", guildId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Guild settings not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params;

  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const allowed = [
    "guild_name",
    "guild_icon_url",
    "bot_enabled",
    "command_prefix",
    "features_enabled",
    "channel_config",
    "homebrew_enabled",
    "allowed_rulebooks",
  ];
  const update = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  );

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("guild_settings")
    .upsert(
      { discord_guild_id: guildId, ...update },
      { onConflict: "discord_guild_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
