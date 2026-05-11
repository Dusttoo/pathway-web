import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { Json } from "@/lib/types/database.types";

// ── Shared: resolve params + ownership ───────────────────────────────────────

async function resolveOwnership(id: string) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return { error: "Unauthorized", status: 401 } as const;

  const service = createServiceClient();

  const { data: entry } = await service
    .from("homebrew_entries")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!entry) return { error: "Not found", status: 404 } as const;

  const { data: dbUser } = await service
    .from("users")
    .select("is_admin, discord_id")
    .eq("id", authUser.id)
    .maybeSingle();

  const canWrite = entry.added_by === dbUser?.discord_id || !!dbUser?.is_admin;

  return { entry, canWrite, service } as const;
}

// ── GET /api/homebrew/[id] ────────────────────────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const service = createServiceClient();

  const { data, error } = await service
    .from("homebrew_entries")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ data });
}

// ── PATCH /api/homebrew/[id] ──────────────────────────────────────────────────
// Body: { name?, data? }
// entry_key (slug) is intentionally immutable — it is the join key between
// Supabase rows and the bot's in-memory maps.

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const resolved = await resolveOwnership(id);

  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  if (!resolved.canWrite) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { name?: string; data?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, data: entryData } = body;
  if (!name && !entryData) {
    return NextResponse.json(
      { error: "Provide name and/or data to update" },
      { status: 400 }
    );
  }

  const updates: { updated_at: string; name?: string; data?: Json } = {
    updated_at: new Date().toISOString(),
  };
  if (name) updates.name = name;
  if (entryData) {
    updates.data = {
      ...entryData,
      _homebrew: true,
      _addedBy: resolved.entry.added_by,
    } as Json;
  }

  const { data, error } = await resolved.service
    .from("homebrew_entries")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// ── DELETE /api/homebrew/[id] ─────────────────────────────────────────────────

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const resolved = await resolveOwnership(id);

  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  if (!resolved.canWrite) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await resolved.service
    .from("homebrew_entries")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
