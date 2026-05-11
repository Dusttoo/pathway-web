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

  const { data: ancestry } = await service
    .from("ancestries")
    .select("id, created_by_user_id, is_official")
    .eq("id", id)
    .maybeSingle();

  if (!ancestry || ancestry.is_official || ancestry.created_by_user_id !== dbUser.id) {
    return { error: "Not found or not yours", status: 403 } as const;
  }

  return { service, appUserId: dbUser.id } as const;
}

// ── PATCH /api/homebrew/ancestries/[id] ──────────────────────────────────────
// Body: { name?, ancestry_hp?, speed?, size?, description?, heritages? }

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
    ancestry_hp?: number;
    speed?: number;
    size?: string;
    description?: string;
    heritages?: { name: string; description?: string }[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { heritages, ...fields } = body;

  // Build typed update (only include fields that were sent)
  const updates: {
    name?: string;
    ancestry_hp?: number;
    speed?: number;
    size?: string;
    description?: string | null;
  } = {};
  if (fields.name !== undefined) updates.name = fields.name.trim();
  if (fields.ancestry_hp !== undefined) updates.ancestry_hp = fields.ancestry_hp;
  if (fields.speed !== undefined) updates.speed = fields.speed;
  if (fields.size !== undefined) updates.size = fields.size;
  if (fields.description !== undefined) updates.description = fields.description || null;

  if (Object.keys(updates).length > 0) {
    const { error } = await resolved.service
      .from("ancestries")
      .update(updates)
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Replace heritages wholesale (delete all + re-insert)
  if (heritages !== undefined) {
    await resolved.service.from("heritages").delete().eq("ancestry_id", id);
    const rows = heritages
      .filter((h) => h.name?.trim())
      .map((h) => ({
        ancestry_id: id,
        name: h.name.trim(),
        description: h.description || null,
        is_official: false,
        is_versatile: false,
        benefits: {} as Json,
        traits: [] as Json,
      }));
    if (rows.length > 0) {
      const { error } = await resolved.service.from("heritages").insert(rows);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const { data } = await resolved.service
    .from("ancestries")
    .select("*, heritages(*)")
    .eq("id", id)
    .single();

  return NextResponse.json({ data });
}
