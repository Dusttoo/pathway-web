import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function resolveUserId(authUser: { id: string; identities?: { provider: string; identity_data?: Record<string, string> }[] }): Promise<string | null> {
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await resolveUserId(authUser);
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("characters")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await resolveUserId(authUser);
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const service = createServiceClient();
  const { data: existing, error: fetchErr } = await service
    .from("characters")
    .select("pathbuilder_id")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (fetchErr || !existing) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  if (!existing.pathbuilder_id) {
    return NextResponse.json({ error: "Character has no Pathbuilder ID — re-import via JSON instead." }, { status: 400 });
  }

  const pbRes = await fetch(`https://pathbuilder2e.com/json.php?id=${existing.pathbuilder_id}`);
  if (!pbRes.ok) {
    return NextResponse.json({ error: "Pathbuilder is unavailable, try again in a moment." }, { status: 502 });
  }
  const pbJson = await pbRes.json();
  if (!pbJson.success) {
    return NextResponse.json({ error: "Pathbuilder ID not found — get a fresh export link from the app." }, { status: 404 });
  }

  const build = pbJson.build;
  if (!build?.name) {
    return NextResponse.json({ error: "Invalid data returned from Pathbuilder." }, { status: 502 });
  }

  const { data, error } = await service
    .from("characters")
    .update({
      name: build.name,
      ancestry_name: build.ancestry ?? null,
      heritage_name: build.heritage ?? null,
      class_name: build.class ?? null,
      background_name: build.background ?? null,
      level: build.level ?? 1,
      pathbuilder_data: pbJson.build,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await resolveUserId(authUser);
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const service = createServiceClient();
  const { error } = await service
    .from("characters")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return new Response(null, { status: 204 });
}
