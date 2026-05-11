import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const VALID_TYPES = new Set([
  "monster",
  "spell",
  "item",
  "feat",
  "heritage",
  "ancestry",
  "class",
  "background",
]);
const VIRTUAL_TYPES = new Set(["feat", "heritage", "ancestry", "class", "background"]);

type HomebrewRow = {
  id: string;
  type: string;
  entry_key: string;
  name: string;
  data: Record<string, unknown>;
  added_by: string | null;
  created_at: string;
  updated_at: string;
};

function virtualType(row: HomebrewRow) {
  const kind = row.data?._homebrew_type;
  return typeof kind === "string" && VIRTUAL_TYPES.has(kind) ? kind : row.type;
}

function normalizeRow(row: HomebrewRow) {
  return { ...row, type: virtualType(row) };
}

function storageType(type: string) {
  return VIRTUAL_TYPES.has(type) ? "item" : type;
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// GET /api/homebrew
// Query params: type, q, page, limit
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "";
  const q = searchParams.get("q") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "25")));
  const offset = (page - 1) * limit;

  const service = createServiceClient();

  const needsVirtualFilter =
    type === "item" ||
    type === "feat" ||
    type === "heritage" ||
    type === "ancestry" ||
    type === "class" ||
    type === "background";

  let query = service
    .from("homebrew_entries")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (type && VALID_TYPES.has(type)) {
    if (needsVirtualFilter) {
      query = query.in("type", VIRTUAL_TYPES.has(type) ? ["item", type] : ["item"]);
    } else {
      query = query.eq("type", type);
    }
  }
  if (q) query = query.ilike("name", `%${q}%`);
  if (!needsVirtualFilter) query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = ((data ?? []) as HomebrewRow[]).map(normalizeRow);
  const filtered = needsVirtualFilter && type
    ? rows.filter((row) => virtualType(row as HomebrewRow) === type)
    : rows;
  const paged = needsVirtualFilter
    ? filtered.slice(offset, offset + limit)
    : filtered;

  return NextResponse.json({
    data: paged,
    total: needsVirtualFilter ? filtered.length : count,
    page,
    limit,
  });
}

// POST /api/homebrew
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
      { error: `type must be one of: ${[...VALID_TYPES].join(", ")}` },
      { status: 400 }
    );
  }

  const baseKey = toSlug(name);
  const dbType = storageType(type);
  const service = createServiceClient();

  // Resolve key conflicts by appending suffix
  const { data: existing } = await service
    .from("homebrew_entries")
    .select("entry_key")
    .eq("type", dbType)
    .eq("entry_key", baseKey)
    .maybeSingle();

  const entry_key = existing ? `${baseKey}-homebrew` : baseKey;

  // Store the Discord snowflake so the ownership check in [id]/route.ts
  // (which compares added_by to discord_id) works correctly.
  const discordId =
    authUser.identities
      ?.find((i) => i.provider === "discord")
      ?.identity_data?.provider_id ?? authUser.id;

  const { data, error } = await service
    .from("homebrew_entries")
    .insert({
      type: dbType,
      entry_key,
      name,
      data: {
        ...entryData,
        _homebrew: true,
        _homebrew_type: type,
        _addedBy: discordId,
      },
      added_by: discordId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ? normalizeRow(data as HomebrewRow) : data }, { status: 201 });
}
