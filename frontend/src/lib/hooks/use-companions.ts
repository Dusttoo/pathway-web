import { useQuery } from "@tanstack/react-query";
import type { Tables } from "@/lib/types/database.types";
import type { BotCompanion } from "@/lib/types/bot-integration";

export type CompanionRow = Tables<"companions">;

/** Consistent cache-key factory — lets other hooks invalidate companion queries. */
export const companionKeys = {
  all: ["companions"] as const,
  byCharacter: (characterId: string) =>
    [...companionKeys.all, "byCharacter", characterId] as const,
};

/**
 * Maps a `companions` table row back to the `BotCompanion` shape used by
 * CompanionCard and companion math helpers.
 */
function rowToBotCompanion(row: CompanionRow): BotCompanion {
  return {
    displayName: row.display_name,
    baseType:    row.base_type,
    form:        row.form as BotCompanion["form"],
    notes:       row.notes,
    currentHp:   row.current_hp,
    customStats: (row.custom_stats as { customStats?: BotCompanion["customStats"] } | null)
      ?.customStats ?? undefined,
  };
}

type UseCompanionsResult = {
  /** Companions mapped to the BotCompanion shape expected by CompanionCard */
  companions: BotCompanion[];
  /** Raw table rows, useful for keys / metadata */
  companionRows: CompanionRow[];
  isLoading: boolean;
  error: Error | null;
};

/**
 * Fetch companions for a character from the dedicated `companions` table.
 *
 * @param characterId  Supabase `characters.id` UUID
 * @param options      optional `enabled` flag — defaults to true
 */
export function useCompanions(
  characterId: string | null | undefined,
  options?: { enabled?: boolean },
): UseCompanionsResult {
  const enabled = options?.enabled !== false && !!characterId;

  const { data, isLoading, error } = useQuery<{ data: CompanionRow[] }, Error>({
    queryKey: companionKeys.byCharacter(characterId ?? ""),
    queryFn: async () => {
      const res = await fetch(`/api/characters/${characterId}/companions`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled,
    // Companions are written by the bot — treat as authoritative and avoid
    // noisy re-fetches. Realtime could be wired here in a future iteration.
    staleTime: 30_000,
  });

  const companionRows = data?.data ?? [];
  return {
    companions:    companionRows.map(rowToBotCompanion),
    companionRows,
    isLoading,
    error,
  };
}
