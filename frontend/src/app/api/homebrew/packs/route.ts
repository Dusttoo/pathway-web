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
  entry_count?: number;
};

async function authContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { user, service: createServiceClient() as UntypedClient };
}

function cleanContentTypes(value: unknown): string[] {
  if (!Array.isArray(value)) return ["spell", "item"];
  const cleaned = value.filter((item): item is string =>
    typeof item === "string" && VALID_CONTENT_TYPES.has(item)
  );
  return cleaned.length ? [...new Set(cleaned)] : ["spell", "item"];
}

export async function GET(request: Request) {
  const ctx = await authContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  let query = ctx.service
    .from("homebrew_packs")
    .select("*")
    .eq("owner_id", ctx.user.id)
    .order("updated_at", { ascending: false });

  if (q) query = query.ilike("title", `%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const packs = ((data ?? []) as PackRow[]).map((pack) => ({ ...pack, entry_count: 0 }));
  if (packs.length) {
    const { data: entries } = await ctx.service
      .from("homebrew_pack_entries")
      .select("pack_id")
      .in("pack_id", packs.map((pack) => pack.id));
    const counts = new Map<string, number>();
    for (const entry of (entries ?? []) as Array<{ pack_id: string }>) {
      counts.set(entry.pack_id, (counts.get(entry.pack_id) ?? 0) + 1);
    }
    for (const pack of packs) pack.entry_count = counts.get(pack.id) ?? 0;
  }

  return NextResponse.json({ data: packs, total: packs.length });
}

export async function POST(request: Request) {
  const ctx = await authContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "Pack title is required" }, { status: 400 });

  const visibility =
    typeof body.visibility === "string" && VALID_VISIBILITY.has(body.visibility)
      ? body.visibility
      : "private";
  const status =
    typeof body.status === "string" && VALID_STATUS.has(body.status)
      ? body.status
      : "draft";

  const { data, error } = await ctx.service
    .from("homebrew_packs")
    .insert({
      owner_id: ctx.user.id,
      title,
      description: typeof body.description === "string" ? body.description.trim() || null : null,
      cover_image_url:
        typeof body.cover_image_url === "string" ? body.cover_image_url.trim() || null : null,
      visibility,
      status,
      content_types: cleanContentTypes(body.content_types),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
