import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const VALID_TYPES = new Set(["monster", "spell", "item", "feat", "heritage"]);

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── GET /api/homebrew ─────────────────────────────────────────────────────────
// Query params: type, q, page, limit
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "";
  const q = searchParams.get("q") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "25")));
  const offset = (page - 1) * limit;

  const service = createServiceClient();

  let query = service
    .from("homebrew_entries")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (type && VALID_TYPES.has(type)) query = query.eq("type", type);
  if (q) query = query.ilike("name", `%${q}%`);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data, total: count, page, limit });
}

// ── POST /api/homebrew ────────────────────────────────────────────────────────
// Body: { type, name, data }
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { type?: string; name?: string; data?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { type, name, data: entryData } = body;

  if (!type || !name || !entryData) {
    return NextResponse.json(
      { error: "type, name, and data are required" },
      { status: 400 }
    );
  }
  if (!VALID_TYPES.has(type)) {
    return NextResponse.json(
      { error: "type must be monster, spell, item, feat, or heritage" },
      { status: 400 }
    );
  }

  const baseKey = toSlug(name);
  const service = createServiceClient();

  // Resolve key conflicts by appending suffix
  const { data: existing } = await service
    .from("homebrew_entries")
    .select("entry_key")
    .eq("type", type)
    .eq("entry_key", baseKey)
    .maybeSingle();

  const entry_key = existing ? `${baseKey}-homebrew` : baseKey;

  const { data, error } = await service
    .from("homebrew_entries")
    .insert({
      type,
      entry_key,
      name,
      data: { ...entryData, _homebrew: true, _addedBy: authUser.id },
      added_by: authUser.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
