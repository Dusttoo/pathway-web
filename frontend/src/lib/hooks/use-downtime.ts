import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Tables } from "@/lib/types/database.types";
import { createClient } from "@/lib/supabase/client";

type DowntimeRow = Tables<"downtime">;

export type DowntimeLogEntry = {
  date: string;
  delta: number;
  balance: number;
  reason: string;
  by?: string;
};

export const downtimeKeys = {
  all: ["downtime"] as const,
  forChar: (charKey: string) => [...downtimeKeys.all, charKey] as const,
};

export function useCharacterDowntime(charKey: string | null | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery<DowntimeRow | null, Error>({
    queryKey: downtimeKeys.forChar(charKey ?? ""),
    queryFn: async () => {
      if (!charKey) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from("downtime")
        .select("*")
        .eq("char_key", charKey)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!charKey,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!charKey) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`downtime-${charKey}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "downtime", filter: `char_key=eq.${charKey}` },
        (payload) => {
          queryClient.setQueryData(
            downtimeKeys.forChar(charKey),
            (old: DowntimeRow | null | undefined) =>
              old ? { ...old, ...payload.new } : (payload.new as DowntimeRow)
          );
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [charKey, queryClient]);

  return query;
}
