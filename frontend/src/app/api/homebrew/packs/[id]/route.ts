import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type UntypedClient = ReturnType<typeof createServiceClient> & {
  from: (table: string) => any;
};

const VALID_VISIBILITY = new Set(["private", "shared", "public"]);
const VALID_STATUS = new Set(["draft", "published"]);
const VALID_CONTENT_TYPES = new Set(["spell", "item"]);

type PackRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  visibility: "private" | "shared" | "public";
  status: "draft" | "published";
  content_types: string[];
  created_at: string;
  updated_at: string;
};

async function resolvePack(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 } as const;

  const service = createServiceClient() as UntypedClient;
  const { data: pack, error } = await service
    .from("homebrew_packs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !pack) return { error: "Not found", status: 404 } as const;

  const row = pack as PackRow;
  const canWrite = row.owner_id === user.id;
  const canRead = canWrite || row.visibility === "shared" || row.visibility === "public";
  if (!canRead) return { error: "Forbidden", status: 403 } as const;

  return { user, service, pack: row, canWrite } as const;
}

function cleanContentTypes(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const cleaned = value.filter((item): item is string =>
    typeof item === "string" && VALID_CONTENT_TYPES.has(item)
  );
  return cleaned.length ? [...new Set(cleaned)] : undefined;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const resolved = await resolvePack(id);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const { data: entries, error } = await resolved.service
    .from("homebrew_pack_entries")
    .select("*, homebrew_entry:homebrew_entries(*)")
    .eq("pack_id", id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    data: resolved.pack,
    entries: entries ?? [],
    canWrite: resolved.canWrite,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const resolved = await resolvePack(id);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  if (!resolved.canWrite) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof body.title === "string") {
    const title = body.title.trim();
    if (!title) return NextResponse.json({ error: "Pack title is required" }, { status: 400 });
    updates.title = title;
  }
  if ("description" in body) {
    updates.description =
      typeof body.description === "string" ? body.description.trim() || null : null;
  }
  if ("cover_image_url" in body) {
    updates.cover_image_url =
      typeof body.cover_image_url === "string" ? body.cover_image_url.trim() || null : null;
  }
  if (typeof body.visibility === "string" && VALID_VISIBILITY.has(body.visibility)) {
    updates.visibility = body.visibility;
  }
  if (typeof body.status === "string" && VALID_STATUS.has(body.status)) {
    updates.status = body.status;
  }
  const contentTypes = cleanContentTypes(body.content_types);
  if (contentTypes) updates.content_types = contentTypes;

  const { data, error } = await resolved.service
    .from("homebrew_packs")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const resolved = await resolvePack(id);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  if (!resolved.canWrite) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await resolved.service.from("homebrew_packs").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
