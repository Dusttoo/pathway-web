import { useQuery } from "@tanstack/react-query";
import type { Tables } from "@/lib/types/database.types";
import { createClient } from "@/lib/supabase/client";

type BagRow = Tables<"bags">;

export type BagItem = { name: string; qty: number };
export type BagCategories = Record<string, BagItem[]>;

export const bagKeys = {
  all: ["bags"] as const,
  mine: () => [...bagKeys.all, "mine"] as const,
};

export function useBag() {
  return useQuery<BagRow | null, Error>({
    queryKey: bagKeys.mine(),
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("bags")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });
}
