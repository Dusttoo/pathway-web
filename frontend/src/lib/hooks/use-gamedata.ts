import { useQuery } from "@tanstack/react-query";
import type { Tables } from "@/lib/types/database.types";

type GamedataRow = Tables<"gamedata">;

// The full list of seeded categories. Use this in UI dropdowns / route params.
export const GAMEDATA_CATEGORIES = [
  "actions", "afflictions", "backgrounds", "class_features", "classes",
  "companions", "conditions", "creature_extras", "deities", "domains",
  "familiars", "hazards", "heritages", "kingdom", "languages", "planes",
  "relics", "rituals", "rules", "siege_weapons", "skills", "sources",
  "traits", "vehicles",
] as const;

export type GamedataCategory = (typeof GAMEDATA_CATEGORIES)[number];

type GamedataListResult = {
  data: GamedataRow[];
  total: number | null;
  page: number;
  limit: number;
  category: string;
};

type SingleResult = { data: GamedataRow };

type ListParams = {
  category: GamedataCategory;
  q?: string;
  page?: number;
  limit?: number;
};

// ── Query key factory ────────────────────────────────────────────────────────
export const gamedataKeys = {
  all:    ["gamedata"] as const,
  list:   (p: ListParams) => [...gamedataKeys.all, "list", p] as const,
  detail: (category: GamedataCategory, slug: string) =>
    [...gamedataKeys.all, "detail", category, slug] as const,
};

// ── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Browse / search entries for a gamedata category.
 *
 * @example
 *   const { data } = useGamedata({ category: "traits", q: "fire" });
 */
export function useGamedata(params: ListParams, options?: { enabled?: boolean }) {
  return useQuery<GamedataListResult, Error>({
    queryKey: gamedataKeys.list(params),
    queryFn: async () => {
      const qs = new URLSearchParams({ category: params.category });
      if (params.q)     qs.set("q",     params.q);
      if (params.page)  qs.set("page",  String(params.page));
      if (params.limit) qs.set("limit", String(params.limit));
      const res = await fetch(`/api/content/gamedata?${qs}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: options?.enabled !== false && !!params.category,
  });
}

/**
 * Fetch a single gamedata entry by category + slug.
 *
 * @example
 *   const { data } = useGamedataEntry("conditions", "blinded");
 */
export function useGamedataEntry(
  category: GamedataCategory,
  slug: string,
  options?: { enabled?: boolean }
) {
  return useQuery<SingleResult, Error>({
    queryKey: gamedataKeys.detail(category, slug),
    queryFn: async () => {
      const qs = new URLSearchParams({ category, slug });
      const res = await fetch(`/api/content/gamedata?${qs}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: options?.enabled !== false && !!category && !!slug,
  });
}
