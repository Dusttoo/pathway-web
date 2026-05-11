import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { TablesUpdate } from "@/lib/types/database.types";
import type { CharacterOverlay } from "@/lib/types/bot-integration";

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

// ── PATCH — update live stat fields (HP, hero points, dying, wounded, overlay) ──
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await resolveUserId(authUser);
  if (!userId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await request.json() as {
    current_hp?:  number;
    hero_points?: number;
    dying?:       number;
    wounded?:     number;
    overlay?: Partial<CharacterOverlay>;
    build_patch?: {
      feats?: Array<[string, string | null, string | null, string | null]>;
      proficiencies?: Record<string, number>;
      specials?: string[];
      custom_attacks?: { name: string; bonus: string; damage: string; traits: string }[];
    };
  };

  const service = createServiceClient();

  // Fetch current row so we can derive maxHp and safely merge overlay
  const { data: existing } = await service
    .from("characters")
    .select("pathbuilder_data, overlay, hero_points, dying, wounded")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Character not found" }, { status: 404 });

  // Build the update payload — only include fields explicitly sent
  const updates: TablesUpdate<"characters"> = {};

  if (body.current_hp !== undefined) {
    // Clamp to [0, maxHp] server-side
    const pb   = existing.pathbuilder_data as { build?: Record<string, unknown> } | Record<string, unknown> | null;
    const build = pb ? ((pb as { build?: Record<string, unknown> }).build ?? pb) : null;
    const attrs = (build as { attributes?: { ancestryhp?: number; classhp?: number; bonushp?: number; bonushpPerLevel?: number } } | null)?.attributes;
    const level = (build as { level?: number } | null)?.level ?? 1;
    const maxHp = attrs
      ? (attrs.ancestryhp ?? 0) + ((attrs.classhp ?? 0) + (attrs.bonushpPerLevel ?? 0)) * level + (attrs.bonushp ?? 0)
      : null;
    updates.current_hp = maxHp !== null
      ? Math.max(0, Math.min(maxHp, body.current_hp))
      : Math.max(0, body.current_hp);
  }

  if (body.hero_points !== undefined) {
    updates.hero_points = Math.max(0, Math.min(3, Math.round(body.hero_points)));
  }
  if (body.dying !== undefined) {
    updates.dying = Math.max(0, Math.min(4, Math.round(body.dying)));
  }
  if (body.wounded !== undefined) {
    updates.wounded = Math.max(0, Math.min(3, Math.round(body.wounded)));
  }

  // Safely deep-merge overlay — never overwrite unrelated bot-owned keys
  if (body.overlay) {
    const current = (existing.overlay ?? {}) as Record<string, unknown>;
    const currentDaily = (current.daily ?? {}) as Record<string, unknown>;
    updates.overlay = {
      ...current,
      ...body.overlay,
      daily: {
        ...currentDaily,
        ...(body.overlay.daily ?? {}),
      },
    };
  }

  if (body.build_patch) {
    const pb = existing.pathbuilder_data as { build?: Record<string, unknown> } | Record<string, unknown> | null;
    const hasWrapper = !!pb && "build" in pb;
    const build = pb ? ({ ...((pb as { build?: Record<string, unknown> }).build ?? pb) } as Record<string, unknown>) : {};

    if (body.build_patch.feats) {
      build.feats = body.build_patch.feats;
    }
    if (body.build_patch.specials) {
      build.specials = body.build_patch.specials;
    }
    if (body.build_patch.custom_attacks) {
      build.custom_attacks = body.build_patch.custom_attacks;
    }
    if (body.build_patch.proficiencies) {
      build.proficiencies = {
        ...((build.proficiencies ?? {}) as Record<string, number>),
        ...body.build_patch.proficiencies,
      };
    }

    updates.pathbuilder_data = (hasWrapper
      ? { ...(pb as Record<string, unknown>), build }
      : build) as TablesUpdate<"characters">["pathbuilder_data"];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await service
    .from("characters")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
