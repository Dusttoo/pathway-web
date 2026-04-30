import { useQuery } from "@tanstack/react-query";
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
  return useQuery<DowntimeRow | null, Error>({
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
    staleTime: 30_000,
  });
}
