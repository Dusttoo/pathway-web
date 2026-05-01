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

type UpdatePayload = {
  id: string;
  name?: string;
  data?: Record<string, unknown>;
};

// ── Query key factory ─────────────────────────────────────────────────────────
export const homebrewKeys = {
  all:    ["homebrew"] as const,
  list:   (p: HomebrewParams) => [...homebrewKeys.all, "list", p] as const,
  detail: (id: string)        => [...homebrewKeys.all, "detail", id] as const,
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
      if (params.type)  qs.set("type",  params.type);
      if (params.q)     qs.set("q",     params.q);
      if (params.page)  qs.set("page",  String(params.page));
      if (params.limit) qs.set("limit", String(params.limit));
      const res = await fetch(`/api/homebrew?${qs}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: options?.enabled !== false,
  });
}

/**
 * Fetch a single homebrew entry by its Supabase UUID.
 */
export function useHomebrewEntry(id: string, options?: { enabled?: boolean }) {
  return useQuery<{ data: HomebrewEntry }, Error>({
    queryKey: homebrewKeys.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/homebrew/${id}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: options?.enabled !== false && !!id,
  });
}

/**
 * Create a new homebrew entry (monster, spell, or item).
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
 * Update an existing homebrew entry (name and/or data).
 * entry_key (slug) is never changed on update.
 */
export function useUpdateHomebrew() {
  const qc = useQueryClient();
  return useMutation<{ data: HomebrewEntry }, Error, UpdatePayload>({
    mutationFn: async ({ id, ...body }) => {
      const res = await fetch(`/api/homebrew/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: homebrewKeys.all });
      qc.invalidateQueries({ queryKey: homebrewKeys.detail(id) });
    },
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
      if (!res.ok && res.status !== 204) throw new Error(await res.text());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: homebrewKeys.all }),
  });
}
