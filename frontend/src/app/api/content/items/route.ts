import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type ItemRow = {
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

function itemKey(row: ItemRow): string {
  return [
    row.name.trim().toLowerCase().replace(/\s+/g, " "),
    row.level ?? 0,
    row.item_type?.trim().toLowerCase() ?? "",
    row.item_subtype?.trim().toLowerCase() ?? "",
  ].join("|");
}

function hasStructuredJson(value: unknown): boolean {
  return Array.isArray(value) ? value.length > 0 : !!value && typeof value === "object";
}

function completenessScore(row: ItemRow): number {
  const rarity = row.rarity?.toLowerCase();
  const descriptionLength = row.description?.trim().length ?? 0;

  return (
    (row.is_official ? 1000 : 0) +
    (row.source ? 250 : 0) +
    (rarity && rarity !== "common" ? 100 : 0) +
    (row.price_cp && row.price_cp > 0 ? 75 : 0) +
    (row.bulk ? 50 : 0) +
    (row.usage ? 50 : 0) +
    (row.is_magical ? 50 : 0) +
    (hasStructuredJson(row.traits) ? 50 : 0) +
    (hasStructuredJson(row.item_metadata) ? 50 : 0) +
    Math.min(descriptionLength, 750)
  );
}

function dedupeItems(rows: ItemRow[]): ItemRow[] {
  const byItem = new Map<string, ItemRow>();

  for (const row of rows) {
    const key = itemKey(row);
    const existing = byItem.get(key);

    if (!existing || completenessScore(row) > completenessScore(existing)) {
      byItem.set(key, row);
    }
  }

  return [...byItem.values()].sort(
    (a, b) => (a.level ?? 0) - (b.level ?? 0) || a.name.localeCompare(b.name)
  );
}

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

  if (itemType) query = query.eq("item_type", itemType);
  if (level) query = query.eq("level", parseInt(level));

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const deduped = dedupeItems((data ?? []) as ItemRow[]);
  const paged = deduped.slice(offset, offset + limit);

  return NextResponse.json({ data: paged, total: deduped.length, page, limit });
}
