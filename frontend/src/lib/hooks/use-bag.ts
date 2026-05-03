import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BagData } from "@/app/api/inventory/route";

export type { BagItem, BagCategories, BagData } from "@/app/api/inventory/route";

export const bagKeys = {
  all:  ["bags"] as const,
  mine: () => [...bagKeys.all, "mine"] as const,
};

export function useBag() {
  const queryClient = useQueryClient();

  const query = useQuery<BagData | null, Error>({
    queryKey: bagKeys.mine(),
    queryFn:  async () => {
      const res = await fetch("/api/inventory");
      if (res.status === 401) return null;
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<BagData>;
    },
    staleTime: Infinity,
  });

  // Watch bag_items for Realtime updates (bot writes here, triggers re-fetch)
  useEffect(() => {
    const supabase = createClient();
    const channel  = supabase
      .channel("bag-items-mine")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bag_items" },
        () => { queryClient.invalidateQueries({ queryKey: bagKeys.mine() }); }
      )
      // Also watch bags so a bag rename propagates immediately
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bags" },
        () => { queryClient.invalidateQueries({ queryKey: bagKeys.mine() }); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}
