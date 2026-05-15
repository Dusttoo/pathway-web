import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/types/database.types";
import { NextResponse } from "next/server";

type DraftRow = {
  id: string;
  user_id: string;
  name: string;
  builder_state: Json;
  current_step: number;
  created_at: string;
  updated_at: string;
};

async function resolveUser() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const service = createServiceClient();
  const discordId =
    authUser.identities?.find((identity) => identity.provider === "discord")?.identity_data
      ?.provider_id ?? authUser.id;

  const { data: dbUser } = await service
    .from("users")
    .select("id")
    .eq("discord_id", discordId)
    .single();

  return dbUser ? { appUserId: dbUser.id, service } : null;
}

export async function GET() {
  const ctx = await resolveUser();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await (ctx.service as any)
    .from("character_builder_drafts")
    .select("*")
    .eq("user_id", ctx.appUserId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ draft: (data as DraftRow | null) ?? null });
}

export async function PUT(request: Request) {
  const ctx = await resolveUser();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const builderState = body?.builder_state;
  const currentStep = Number.isFinite(Number(body?.current_step)) ? Number(body.current_step) : 0;
  const rawName = typeof body?.name === "string" ? body.name.trim() : "";
  const name = rawName || "Untitled Character";

  if (!builderState || typeof builderState !== "object" || Array.isArray(builderState)) {
    return NextResponse.json({ error: "builder_state is required" }, { status: 400 });
  }

  const { data, error } = await (ctx.service as any)
    .from("character_builder_drafts")
    .upsert(
      {
        user_id: ctx.appUserId,
        name,
        builder_state: builderState as Json,
        current_step: Math.max(0, Math.round(currentStep)),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ draft: data as DraftRow });
}

export async function DELETE() {
  const ctx = await resolveUser();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await (ctx.service as any)
    .from("character_builder_drafts")
    .delete()
    .eq("user_id", ctx.appUserId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return new NextResponse(null, { status: 204 });
}
