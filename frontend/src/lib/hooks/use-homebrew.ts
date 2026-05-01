import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/lib/types/database.types";

export type HomebrewEntry = Tables<"homebrew_entries">;
export type HomebrewType = "monster" | "spell" | "item";

type HomebrewListResult = {
  data: HomebrewEntry[];
  total: number | null;
  page: number;
  limit: number;
};

type HomebrewParams = {
  type?: HomebrewType;
  q?: string;
  page?: number;
  limit?: number;
};

type CreatePayload = {
  type: HomebrewType;
  name: string;
  data: Record<string, unknown>;
};

// ── Query key factory ─────────────────────────────────────────────────────────
export const homebrewKeys = {
  all: ["homebrew"] as const,
  list: (p: HomebrewParams) => [...homebrewKeys.all, "list", p] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Browse/search homebrew entries.
 * Pass `type` to filter to a single category (monster | spell | item).
 */
export function useHomebrew(
  params: HomebrewParams = {},
  options?: { enabled?: boolean }
) {
  return useQuery<HomebrewListResult, Error>({
    queryKey: homebrewKeys.list(params),
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (params.type) qs.set("type", params.type);
      if (params.q) qs.set("q", params.q);
      if (params.page) qs.set("page", String(params.page));
      if (params.limit) qs.set("limit", String(params.limit));
      const res = await fetch(`/api/homebrew?${qs}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: options?.enabled !== false,
  });
}

/**
 * Create a new homebrew entry (monster, spell, or item).
 * The `data` field should match the bot's expected schema for that type.
 */
export function useCreateHomebrew() {
  const qc = useQueryClient();
  return useMutation<{ data: HomebrewEntry }, Error, CreatePayload>({
    mutationFn: async (payload) => {
      const res = await fetch("/api/homebrew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: homebrewKeys.all }),
  });
}

/**
 * Delete a homebrew entry by its Supabase UUID.
 * Only the creator or an admin may delete.
 */
export function useDeleteHomebrew() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/homebrew/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        throw new Error(await res.text());
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: homebrewKeys.all }),
  });
}
