import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// ── Types (also imported by the combobox component) ───────────────────────────

export type ItemSearchResult = {
  id: string;
  name: string;
  source: "official" | "homebrew";
  item_type?: string;
  level?: number;
  rarity?: string;
};

export type ItemSearchResponse = { results: ItemSearchResult[] };

function searchKey(item: ItemSearchResult): string {
  return [
    item.source,
    item.name.trim().toLowerCase().replace(/\s+/g, " "),
    item.level ?? 0,
    item.item_type?.trim().toLowerCase() ?? "",
  ].join("|");
}

function dedupeResults(items: ItemSearchResult[]): ItemSearchResult[] {
  const byItem = new Map<string, ItemSearchResult>();

  for (const item of items) {
    const key = searchKey(item);
    const existing = byItem.get(key);

    if (!existing || (!existing.rarity && item.rarity)) {
      byItem.set(key, item);
    }
  }

  return [...byItem.values()];
}

// ── GET /api/items/search?q=<query>&limit=<n> ─────────────────────────────────
// Typeahead endpoint used by ItemSearchCombobox.
// Searches official items catalog + homebrew item entries in parallel.
// No auth required — content is not user-specific.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") ?? "6")));

  if (q.length < 2) {
    return NextResponse.json({ results: [] } satisfies ItemSearchResponse);
  }

  const service = createServiceClient();

  // Fetch official items and homebrew item entries in parallel
  const [{ data: officialRows }, { data: homebrewRows }] = await Promise.all([
    service
      .from("items")
      .select("id, name, item_type, level, rarity")
      .eq("is_official", true)
      .ilike("name", `%${q}%`)
      .order("level", { ascending: true })
      .order("name", { ascending: true })
      .limit(limit * 3),
    service
      .from("homebrew_entries")
      .select("id, name")
      .eq("type", "item")
      .ilike("name", `%${q}%`)
      .order("name", { ascending: true })
      .limit(limit),
  ]);

  const official = dedupeResults(
    (officialRows ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      source: "official" as const,
      item_type: r.item_type ?? undefined,
      level: r.level ?? undefined,
      rarity: r.rarity ?? undefined,
    }))
  );

  const homebrew: ItemSearchResult[] = (homebrewRows ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    source: "homebrew",
  }));

  const combined = dedupeResults([...official, ...homebrew]);

  // Combine and sort: names that start with the query float to the top
  const qLower = q.toLowerCase();
  const all = combined
    .sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(qLower);
      const bStarts = b.name.toLowerCase().startsWith(qLower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);

  return NextResponse.json({ results: all } satisfies ItemSearchResponse);
}
