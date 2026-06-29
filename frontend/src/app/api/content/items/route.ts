import { createServiceClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { dedupeItems, type DedupeItemRow } from "@/lib/items/dedupe";
import { NextResponse } from "next/server";

type ItemRow = DedupeItemRow & {
  aon_id: string | null;
  aon_url: string | null;
  bulk: string | null;
  created_at: string | null;
  created_by_user_id: string | null;
  description: string;
  discord_guild_id: string | null;
  id: string;
  is_magical: boolean | null;
  is_official: boolean | null;
  item_metadata: unknown;
  item_subtype: string | null;
  item_type: string | null;
  level: number | null;
  name: string;
  price_cp: number | null;
  rarity: string | null;
  source: string | null;
  traits: unknown;
  updated_at: string | null;
  usage: string | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const itemType = searchParams.get("item_type");
  const level = searchParams.get("level");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "25")));
  const offset = (page - 1) * limit;

  const supabase = createServiceClient();
  let query = supabase
    .from("items")
    .select("*")
    .eq("is_official", true)
    .order("level", { ascending: true })
    .order("name", { ascending: true });

  // `name` = case-insensitive exact match (for modal lookups from character sheets)
  // `q`    = substring search (for browse/search UI)
  const nameExact = searchParams.get("name");
  if (nameExact) {
    query = query.ilike("name", nameExact);
  } else if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  if (level) query = query.eq("level", parseInt(level));

  const { data, error } = await fetchAllRows<ItemRow>(query);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const deduped = dedupeItems(data as ItemRow[])
    .filter((item) => !itemType || item.item_type === itemType)
    .sort((a, b) => (a.level ?? 0) - (b.level ?? 0) || a.name.localeCompare(b.name));
  const paged = deduped.slice(offset, offset + limit);

  return NextResponse.json({ data: paged, total: deduped.length, page, limit });
}
