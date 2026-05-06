import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Tables } from "@/lib/types/database.types";
import type { BotCompanion } from "@/lib/types/bot-integration";
import { createClient } from "@/lib/supabase/client";

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
export function rowToBotCompanion(row: CompanionRow): BotCompanion {
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
 * Fetch companions for a character and subscribe to Realtime updates.
 * Bot-side HP changes during encounters flow to the UI automatically.
 *
 * @param characterId  Supabase `characters.id` UUID
 * @param charKey      The bot's char_key slug — used to scope the Realtime filter
 * @param options      optional `enabled` flag — defaults to true
 */
export function useCompanions(
  characterId: string | null | undefined,
  charKey?: string | null,
  options?: { enabled?: boolean },
): UseCompanionsResult {
  const enabled     = options?.enabled !== false && !!characterId;
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<{ data: CompanionRow[] }, Error>({
    queryKey: companionKeys.byCharacter(characterId ?? ""),
    queryFn: async () => {
      const res = await fetch(`/api/characters/${characterId}/companions`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled,
    staleTime: 30_000,
  });

  // Realtime subscription — keeps companion HP in sync when the bot
  // changes it during an encounter without a page refresh.
  useEffect(() => {
    if (!characterId || !charKey) return;
    const supabase = createClient();
    const channel  = supabase
      .channel(`companions-${characterId}`)
      .on(
        "postgres_changes",
        {
          event:  "UPDATE",
          schema: "public",
          table:  "companions",
          filter: `char_key=eq.${charKey}`,
        },
        (payload) => {
          queryClient.setQueryData<{ data: CompanionRow[] }>(
            companionKeys.byCharacter(characterId),
            (old) => {
              if (!old) return old;
              return {
                data: old.data.map((c) =>
                  c.id === (payload.new as CompanionRow).id
                    ? { ...c, ...(payload.new as CompanionRow) }
                    : c
                ),
              };
            }
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [characterId, charKey, queryClient]);

  const companionRows = data?.data ?? [];
  return {
    companions:    companionRows.map(rowToBotCompanion),
    companionRows,
    isLoading,
    error,
  };
}

// ── Companion mutations ───────────────────────────────────────────────────────

export type PatchCompanionPayload = {
  current_hp?: number | null;
  notes?:      string;
  form?:       string;
};

export function useUpdateCompanion(characterId: string) {
  const queryClient = useQueryClient();

  return useMutation<CompanionRow, Error, { compId: string } & PatchCompanionPayload, { prev: { data: CompanionRow[] } | undefined }>({
    mutationFn: async ({ compId, ...body }) => {
      const res = await fetch(
        `/api/characters/${characterId}/companions/${compId}`,
        {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? res.statusText);
      }
      return res.json();
    },
    onMutate: async ({ compId, ...vars }) => {
      await queryClient.cancelQueries({
        queryKey: companionKeys.byCharacter(characterId),
      });
      const prev = queryClient.getQueryData<{ data: CompanionRow[] }>(companionKeys.byCharacter(characterId));
      queryClient.setQueryData<{ data: CompanionRow[] }>(
        companionKeys.byCharacter(characterId),
        (old) => {
          if (!old) return old;
          return {
            data: old.data.map((c) =>
              c.id === compId ? { ...c, ...vars } : c
            ),
          };
        }
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(companionKeys.byCharacter(characterId), context.prev);
      }
    },
  });
}
