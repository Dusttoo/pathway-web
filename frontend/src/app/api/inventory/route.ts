import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type BagItem = { name: string; qty: number };
type BagCategories = Record<string, BagItem[]>;

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
  const qtyNum = Math.max(1, parseInt(String(qty), 10) || 1);
  const catName = String(category).trim() || "General";
  const itemName = name.trim();

  const service = createServiceClient();
  const { data: existing } = await service
    .from("bags")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const cats: BagCategories = (existing?.categories as BagCategories) ?? {};
  const catItems: BagItem[] = cats[catName] ? [...cats[catName]] : [];

  // Increment qty if item already exists, otherwise push
  const idx = catItems.findIndex((i) => i.name.toLowerCase() === itemName.toLowerCase());
  if (idx >= 0) {
    catItems[idx] = { ...catItems[idx], qty: catItems[idx].qty + qtyNum };
  } else {
    catItems.push({ name: itemName, qty: qtyNum });
  }
  const newCats = { ...cats, [catName]: catItems };

  if (existing) {
    const { data, error } = await service
      .from("bags")
      .update({ categories: newCats })
      .eq("user_id", userId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } else {
    const { data, error } = await service
      .from("bags")
      .insert({ user_id: userId, bag_name: "My Bag", categories: newCats })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  }
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
  const { data: existing } = await service
    .from("bags")
    .select("categories")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "No bag found" }, { status: 404 });

  const cats: BagCategories = (existing.categories as BagCategories) ?? {};
  const catItems = (cats[category] ?? []).filter(
    (i) => i.name.toLowerCase() !== String(itemName).toLowerCase()
  );

  const newCats = { ...cats };
  if (catItems.length === 0) {
    delete newCats[category];
  } else {
    newCats[category] = catItems;
  }

  const { data, error } = await service
    .from("bags")
    .update({ categories: newCats })
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// ── PATCH /api/inventory — rename bag ─────────────────────────────────────────

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = await resolveUserId(authUser);
  if (!userId) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await request.json();
  const { bag_name } = body;
  if (!bag_name || typeof bag_name !== "string" || bag_name.trim().length === 0) {
    return NextResponse.json({ error: "bag_name is required" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("bags")
    .update({ bag_name: bag_name.trim() })
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
