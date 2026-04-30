"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Encounter } from "@/lib/types/bot-integration";

export const encounterKeys = {
  active: ["encounter", "active"] as const,
  guild: (guildId: string) => ["encounter", "guild", guildId] as const,
};

// Fetch all active encounters (read directly from Supabase — no API route needed
// since this is pure client-side read with the anon key + RLS).
async function fetchActiveEncounters(): Promise<Encounter[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("encounters")
    .select("*")
    .eq("status", "active")
    .order("started_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Encounter[];
}

// Returns all active encounters and subscribes to Realtime so the list + each
// encounter's combatant snapshot update live without polling.
export function useActiveEncounters() {
  const queryClient = useQueryClient();

  const query = useQuery<Encounter[], Error>({
    queryKey: encounterKeys.active,
    queryFn: fetchActiveEncounters,
    // Keep data fresh but don't aggressively refetch — Realtime handles updates.
    staleTime: 30_000,
  });

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("encounters-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "encounters" },
        (payload) => {
          queryClient.setQueryData(encounterKeys.active, (old: Encounter[] | undefined) => {
            const rows = old ?? [];
            if (payload.eventType === "INSERT") {
              const enc = payload.new as Encounter;
              return enc.status === "active" ? [...rows, enc] : rows;
            }
            if (payload.eventType === "UPDATE") {
              const updated = payload.new as Encounter;
              if (updated.status === "ended") {
                return rows.filter((r) => r.id !== updated.id);
              }
              return rows.map((r) => (r.id === updated.id ? updated : r));
            }
            if (payload.eventType === "DELETE") {
              return rows.filter((r) => r.id !== (payload.old as Encounter).id);
            }
            return rows;
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}
