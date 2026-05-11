import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const botKey = request.headers.get("x-bot-key");
  if (!botKey || botKey !== process.env.BOT_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pathwayId = searchParams.get("pathway_id");
  if (!pathwayId) {
    return NextResponse.json({ error: "pathway_id is required" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("characters")
    .select("*")
    .eq("id", pathwayId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const pathbuilderData = data.pathbuilder_data as { build?: unknown } | unknown | null;
  const build =
    pathbuilderData && typeof pathbuilderData === "object" && "build" in pathbuilderData
      ? (pathbuilderData as { build?: unknown }).build
      : pathbuilderData;

  return NextResponse.json({
    pathway_id: data.id,
    char_key: data.char_key,
    discord_guild_id: data.discord_guild_id,
    updated_at: data.updated_at,
    build,
    character: data,
  });
}

export async function POST(request: Request) {
  const botKey = request.headers.get("x-bot-key");
  if (!botKey || botKey !== process.env.BOT_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { discord_id, discord_guild_id, pathbuilder_id } = body as {
    discord_id?: string;
    discord_guild_id?: string;
    pathbuilder_id?: number;
  };

  if (!discord_id || !discord_guild_id || !pathbuilder_id) {
    return NextResponse.json(
      { error: "discord_id, discord_guild_id, and pathbuilder_id are required" },
      { status: 400 }
    );
  }

  // Fetch from Pathbuilder
  const pbRes = await fetch(`https://pathbuilder2e.com/json.php?id=${pathbuilder_id}`);
  if (!pbRes.ok) {
    return NextResponse.json(
      { error: `Pathbuilder returned HTTP ${pbRes.status}` },
      { status: 502 }
    );
  }
  const pbJson = await pbRes.json();
  if (!pbJson.success) {
    return NextResponse.json({ error: "Pathbuilder ID not found or expired" }, { status: 404 });
  }
  const build = pbJson.build;
  if (!build?.name) {
    return NextResponse.json(
      { error: "No character data in Pathbuilder response" },
      { status: 502 }
    );
  }

  const service = createServiceClient();

  // Resolve Discord user → Supabase user
  const { data: userRow } = await service
    .from("users")
    .select("id")
    .eq("discord_id", discord_id)
    .maybeSingle();

  if (!userRow) {
    // User hasn't logged into the web app yet — still return the build so bot can store it locally
    return NextResponse.json({ build, stored: false });
  }

  // Upsert to Supabase (same contract as web /api/characters POST)
  await service.from("characters").upsert(
    {
      user_id: userRow.id,
      discord_guild_id,
      name: build.name,
      char_key: build.name.toLowerCase().replace(/\s+/g, "-"),
      ancestry_name: build.ancestry ?? null,
      heritage_name: build.heritage ?? null,
      class_name: build.class ?? null,
      background_name: build.background ?? null,
      level: build.level ?? 1,
      pathbuilder_id,
      pathbuilder_data: build,
    },
    { onConflict: "user_id,char_key" }
  );

  return NextResponse.json({ build, stored: true });
}
