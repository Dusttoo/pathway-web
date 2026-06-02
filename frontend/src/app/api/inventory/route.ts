import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export type BagItem       = { name: string; qty: number };
export type BagCategories = Record<string, BagItem[]>;
export type BagData       = { bag_name: string; categories: BagCategories };
const LEGACY_BAG_CHAR_KEY = "__legacy__";

// ── Auth helper ───────────────────────────────────────────────────────────────

async function resolveUserId(authUser: {
  id: string;
  identities?: { provider: string; identity_data?: Record<string, string> }[];
}): Promise<string | null> {
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

// ── Item resolution helper ────────────────────────────────────────────────────
// Looks up an item name in the official items catalog, then homebrew_entries,
// then falls back to custom_name. Returns the three nullable ref columns.

async function resolveItemRef(itemName: string): Promise<{
  item_id:     string | null;
  homebrew_id: string | null;
  custom_name: string | null;
}> {
  const service = createServiceClient();

  const { data: itemRow } = await service
    .from("items")
    .select("id")
    .ilike("name", itemName)
    .maybeSingle();
  if (itemRow) return { item_id: itemRow.id, homebrew_id: null, custom_name: null };

  const { data: hbRow } = await service
    .from("homebrew_entries")
    .select("id")
    .ilike("name", itemName)
    .eq("type", "item")
    .maybeSingle();
  if (hbRow) return { item_id: null, homebrew_id: hbRow.id, custom_name: null };

  return { item_id: null, homebrew_id: null, custom_name: itemName };
}

// ── GET /api/inventory ────────────────────────────────────────────────────────
// Returns the user's bag in the canonical shape used across the whole app.

export async function GET() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await resolveUserId(authUser);
  if (!userId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const service = createServiceClient();

  const [{ data: bagRow }, { data: items, error: itemsErr }] = await Promise.all([
    service.from("bags").select("bag_name").eq("user_id", userId).eq("char_key", LEGACY_BAG_CHAR_KEY).maybeSingle(),
    service
      .from("bag_items")
      .select("category, display_name, quantity, sort_order")
      .eq("user_id", userId)
      .eq("char_key", LEGACY_BAG_CHAR_KEY)
      .order("sort_order", { ascending: true }),
  ]);

  if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 });

  const categories: BagCategories = {};
  for (const item of items ?? []) {
    const cat = item.category ?? "General";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push({ name: item.display_name, qty: item.quantity });
  }

  return NextResponse.json({
    bag_name:   bagRow?.bag_name ?? "My Bag",
    categories,
  } satisfies BagData);
}

// ── POST /api/inventory — add an item ─────────────────────────────────────────

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await resolveUserId(authUser);
  if (!userId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await request.json();
  const { name, qty = 1, category = "General" } = body;
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const qtyNum   = Math.max(1, parseInt(String(qty), 10) || 1);
  const catName  = String(category).trim() || "General";
  const itemName = name.trim();

  const service = createServiceClient();

  // Ensure bag metadata row exists (idempotent — never overwrites bag_name)
  await service.from("bags").upsert(
    { user_id: userId, char_key: LEGACY_BAG_CHAR_KEY, bag_name: "My Bag", categories: {} },
    { onConflict: "user_id,char_key", ignoreDuplicates: true }
  );

  // Increment qty if item already exists in this category
  const { data: existing } = await service
    .from("bag_items")
    .select("id, quantity")
    .eq("user_id", userId)
    .eq("char_key", LEGACY_BAG_CHAR_KEY)
    .eq("category", catName)
    .ilike("display_name", itemName)
    .maybeSingle();

  if (existing) {
    const { error } = await service
      .from("bag_items")
      .update({ quantity: existing.quantity + qtyNum })
      .eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // New item — resolve catalog reference then insert
  const ref = await resolveItemRef(itemName);
  const { error } = await service.from("bag_items").insert({
    user_id:      userId,
    char_key:     LEGACY_BAG_CHAR_KEY,
    category:     catName,
    display_name: itemName,
    quantity:     qtyNum,
    ...ref,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

// ── DELETE /api/inventory — remove an item ────────────────────────────────────

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await resolveUserId(authUser);
  if (!userId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await request.json();
  const { category, itemName } = body;
  if (!category || !itemName) {
    return NextResponse.json({ error: "category and itemName are required" }, { status: 400 });
  }

  const service = createServiceClient();
  const { error } = await service
    .from("bag_items")
    .delete()
    .eq("user_id", userId)
    .eq("char_key", LEGACY_BAG_CHAR_KEY)
    .eq("category", String(category))
    .ilike("display_name", String(itemName));

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// ── PATCH /api/inventory ──────────────────────────────────────────────────────
//  { bag_name: string }                          → rename the bag
//  { category, itemName, qty: number }           → set an item's quantity

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await resolveUserId(authUser);
  if (!userId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body    = await request.json();
  const service = createServiceClient();

  // ── Update item quantity ──────────────────────────────────────────────────
  if (body.category !== undefined && body.itemName !== undefined && body.qty !== undefined) {
    const qtyNum = Math.max(1, parseInt(String(body.qty), 10) || 1);

    const { error } = await service
      .from("bag_items")
      .update({ quantity: qtyNum })
      .eq("user_id", userId)
      .eq("char_key", LEGACY_BAG_CHAR_KEY)
      .eq("category", String(body.category))
      .ilike("display_name", String(body.itemName));

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // ── Rename bag ────────────────────────────────────────────────────────────
  const { bag_name } = body;
  if (!bag_name || typeof bag_name !== "string" || bag_name.trim().length === 0) {
    return NextResponse.json(
      { error: "Provide bag_name to rename, or { category, itemName, qty } to update quantity" },
      { status: 400 }
    );
  }

  const { error } = await service
    .from("bags")
    .update({ bag_name: bag_name.trim() })
    .eq("user_id", userId)
    .eq("char_key", LEGACY_BAG_CHAR_KEY);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
