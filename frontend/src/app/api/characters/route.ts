import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const guildId = searchParams.get("guild_id");
  const status = searchParams.get("status") ?? "active";

  const service = createServiceClient();
  const discordId =
    authUser.identities?.find((i) => i.provider === "discord")
      ?.identity_data?.provider_id ?? authUser.id;

  const userResult = await service
    .from("users")
    .select("id")
    .eq("discord_id", discordId)
    .single();

  if (!userResult.data) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let query = service
    .from("characters")
    .select("*")
    .eq("user_id", userResult.data.id)
    .eq("status", status)
    .order("updated_at", { ascending: false });

  if (guildId) query = query.eq("discord_guild_id", guildId);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { pathbuilder_data, pathbuilder_id, discord_guild_id } = body;

  if (!discord_guild_id) {
    return NextResponse.json({ error: "discord_guild_id is required" }, { status: 400 });
  }

  if (!pathbuilder_data && !pathbuilder_id) {
    return NextResponse.json(
      { error: "Either pathbuilder_data or pathbuilder_id is required" },
      { status: 400 }
    );
  }

  let sheetData = pathbuilder_data;

  // Fetch from Pathbuilder API if only ID provided
  if (!sheetData && pathbuilder_id) {
    const pbRes = await fetch(
      `https://pathbuilder2e.com/json.php?id=${pathbuilder_id}`
    );
    if (!pbRes.ok) {
      return NextResponse.json({ error: "Failed to fetch from Pathbuilder" }, { status: 502 });
    }
    const pbJson = await pbRes.json();
    if (!pbJson.success) {
      return NextResponse.json({ error: "Pathbuilder character not found" }, { status: 404 });
    }
    sheetData = pbJson.build;
  }

  const build = sheetData?.build ?? sheetData;
  if (!build?.name) {
    return NextResponse.json({ error: "Invalid Pathbuilder data" }, { status: 400 });
  }

  const service = createServiceClient();
  const discordId =
    authUser.identities?.find((i) => i.provider === "discord")
      ?.identity_data?.provider_id ?? authUser.id;

  const userResult = await service
    .from("users")
    .select("id")
    .eq("discord_id", discordId)
    .single();

  if (!userResult.data) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data, error } = await service
    .from("characters")
    .insert({
      user_id: userResult.data.id,
      discord_guild_id,
      name: build.name,
      char_key: build.name.toLowerCase().replace(/\s+/g, '-'),
      ancestry_name: build.ancestry ?? null,
      heritage_name: build.heritage ?? null,
      class_name: build.class ?? null,
      background_name: build.background ?? null,
      level: build.level ?? 1,
      pathbuilder_id: pathbuilder_id ?? null,
      pathbuilder_data: sheetData,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
